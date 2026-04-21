package com.nadavramon.job_tracker.service;

import com.nadavramon.job_tracker.dto.ApplicationRequest;
import com.nadavramon.job_tracker.dto.ApplicationResponse;
import com.nadavramon.job_tracker.dto.ApplicationStatsResponse;
import com.nadavramon.job_tracker.dto.ApplicationUpdateRequest;
import com.nadavramon.job_tracker.dto.CredentialsResponse;
import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.JobType;
import com.nadavramon.job_tracker.enums.Status;
import com.nadavramon.job_tracker.exception.ResourceNotFoundException;
import com.nadavramon.job_tracker.exception.ResourceOwnershipException;
import com.nadavramon.job_tracker.repository.ApplicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private CurrentUserService currentUserService;

    @Mock
    private EncryptionService encryptionService;

    private ApplicationService applicationService;

    private User currentUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        applicationService = new ApplicationService(applicationRepository, currentUserService, encryptionService);

        currentUser = new User();
        currentUser.setId(UUID.randomUUID());
        currentUser.setUsername("johndoe");

        otherUser = new User();
        otherUser.setId(UUID.randomUUID());
        otherUser.setUsername("janedoe");
    }

    private void stubCurrentUser() {
        when(currentUserService.getCurrentUser()).thenReturn(currentUser);
    }

    private Application makeApplication(User owner, Status status) {
        Application app = new Application();
        app.setId(UUID.randomUUID());
        app.setUser(owner);
        app.setCompanyName("Google");
        app.setJobRole("Developer");
        app.setLocation("Tel Aviv");
        app.setJobType(JobType.FULL_TIME);
        app.setStatus(status);
        app.setAppliedDate(LocalDate.now());
        app.setStatusChangedDate(LocalDate.now());
        return app;
    }

    private ApplicationRequest makeCreateRequest() {
        ApplicationRequest request = new ApplicationRequest();
        request.setCompanyName("Meta");
        request.setJobRole("Engineer");
        request.setLocation("London");
        request.setStatus(Status.APPLIED);
        request.setJobType(JobType.FULL_TIME);
        request.setAppliedDate(LocalDate.of(2026, 4, 1));
        request.setWebsiteLink("https://meta.com/careers");
        request.setUsername("portal-user");
        request.setPassword("portal-pass");
        return request;
    }

    // ── getApplicationByUser ──────────────────────────────────────────────

    @Test
    void getApplication_ReturnsResponse_WhenUserOwnsIt() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        ApplicationResponse response = applicationService.getApplicationByUser(app.getId());

        assertEquals("Google", response.getCompanyName());
        assertEquals(Status.APPLIED, response.getStatus());
    }

    @Test
    void getApplication_ThrowsNotFound_WhenIdDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(applicationRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> applicationService.getApplicationByUser(id));
    }

    @Test
    void getApplication_ThrowsOwnership_WhenUserDoesNotOwnIt() {
        stubCurrentUser();
        Application app = makeApplication(otherUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        assertThrows(ResourceOwnershipException.class,
                () -> applicationService.getApplicationByUser(app.getId()));
    }

    @Test
    void getApplication_ResponseDoesNotIncludePassword() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        app.setPassword("encrypted-secret");
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        ApplicationResponse response = applicationService.getApplicationByUser(app.getId());

        // ApplicationResponse has no password field — verify through username only
        assertEquals(app.getUsername(), response.getUsername());
        // Encryption service should NOT be called during a normal get
        verify(encryptionService, never()).decrypt(any());
    }

    // ── createApplicationByUser ───────────────────────────────────────────

    @Test
    void createApplication_SavesWithCorrectFields() {
        stubCurrentUser();
        ApplicationRequest request = makeCreateRequest();
        when(encryptionService.encrypt("portal-pass")).thenReturn("encrypted-pass");
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        ApplicationResponse response = applicationService.createApplicationByUser(request);

        assertEquals("Meta", response.getCompanyName());
        assertEquals("Engineer", response.getJobRole());
        assertEquals("London", response.getLocation());
        assertEquals(Status.APPLIED, response.getStatus());
        assertEquals(JobType.FULL_TIME, response.getJobType());
    }

    @Test
    void createApplication_SetsStatusChangedDateToToday() {
        stubCurrentUser();
        ApplicationRequest request = makeCreateRequest();
        when(encryptionService.encrypt(any())).thenReturn("enc");
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        ApplicationResponse response = applicationService.createApplicationByUser(request);

        assertEquals(LocalDate.now(), response.getStatusChangedDate());
    }

    @Test
    void createApplication_EncryptsPasswordBeforeSaving() {
        stubCurrentUser();
        ApplicationRequest request = makeCreateRequest();
        when(encryptionService.encrypt("portal-pass")).thenReturn("encrypted-portal");
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        applicationService.createApplicationByUser(request);

        ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
        verify(applicationRepository).save(captor.capture());
        assertEquals("encrypted-portal", captor.getValue().getPassword());
    }

    @Test
    void createApplication_SetsCurrentUserAsOwner() {
        stubCurrentUser();
        ApplicationRequest request = makeCreateRequest();
        when(encryptionService.encrypt(any())).thenReturn("enc");
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> {
            Application a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        applicationService.createApplicationByUser(request);

        ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
        verify(applicationRepository).save(captor.capture());
        assertEquals(currentUser.getId(), captor.getValue().getUser().getId());
    }

    // ── updateApplicationByUser ───────────────────────────────────────────

    @Test
    void updateApplication_UpdatesProvidedFields() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setCompanyName("Amazon");
        request.setLocation("Seattle");

        ApplicationResponse response = applicationService.updateApplicationByUser(app.getId(), request);

        assertEquals("Amazon", response.getCompanyName());
        assertEquals("Seattle", response.getLocation());
    }

    @Test
    void updateApplication_ThrowsNotFound_WhenIdDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(applicationRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> applicationService.updateApplicationByUser(id, new ApplicationUpdateRequest()));
    }

    @Test
    void updateApplication_ThrowsOwnership_WhenUserDoesNotOwnIt() {
        stubCurrentUser();
        Application app = makeApplication(otherUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        assertThrows(ResourceOwnershipException.class,
                () -> applicationService.updateApplicationByUser(app.getId(), new ApplicationUpdateRequest()));
    }

    @Test
    void updateApplication_UpdatesStatusChangedDate_WhenStatusActuallyChanges() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        app.setStatusChangedDate(LocalDate.of(2026, 1, 1)); // old date
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setStatus(Status.INTERVIEWING);

        ApplicationResponse response = applicationService.updateApplicationByUser(app.getId(), request);

        assertEquals(Status.INTERVIEWING, response.getStatus());
        assertEquals(LocalDate.now(), response.getStatusChangedDate());
    }

    @Test
    void updateApplication_DoesNotUpdateStatusChangedDate_WhenSameStatus() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        LocalDate originalDate = LocalDate.of(2026, 1, 1);
        app.setStatusChangedDate(originalDate);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setStatus(Status.APPLIED); // same as current

        ApplicationResponse response = applicationService.updateApplicationByUser(app.getId(), request);

        assertEquals(originalDate, response.getStatusChangedDate());
    }

    @Test
    void updateApplication_DoesNotUpdateStatusChangedDate_WhenStatusIsNull() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        LocalDate originalDate = LocalDate.of(2026, 1, 1);
        app.setStatusChangedDate(originalDate);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        // status left null

        applicationService.updateApplicationByUser(app.getId(), request);

        assertEquals(originalDate, app.getStatusChangedDate());
    }

    @Test
    void updateApplication_IgnoresNullFields() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        app.setCompanyName("Original");
        app.setLocation("Original City");
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        // all fields null

        ApplicationResponse response = applicationService.updateApplicationByUser(app.getId(), request);

        assertEquals("Original", response.getCompanyName());
        assertEquals("Original City", response.getLocation());
    }

    @Test
    void updateApplication_EncryptsPassword_WhenPasswordProvided() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(encryptionService.encrypt("new-portal-pass")).thenReturn("encrypted-new");
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        ApplicationUpdateRequest request = new ApplicationUpdateRequest();
        request.setPassword("new-portal-pass");

        applicationService.updateApplicationByUser(app.getId(), request);

        ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
        verify(applicationRepository).save(captor.capture());
        assertEquals("encrypted-new", captor.getValue().getPassword());
    }

    // ── getApplicationCredentials ─────────────────────────────────────────

    @Test
    void getCredentials_DecryptsAndReturnsCredentials() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        app.setUsername("portal-user");
        app.setPassword("encrypted-pass");
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(encryptionService.decrypt("encrypted-pass")).thenReturn("plain-pass");

        CredentialsResponse response = applicationService.getApplicationCredentials(app.getId());

        assertEquals("portal-user", response.getUsername());
        assertEquals("plain-pass", response.getPassword());
    }

    @Test
    void getCredentials_ThrowsNotFound_WhenIdDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(applicationRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> applicationService.getApplicationCredentials(id));
    }

    @Test
    void getCredentials_ThrowsOwnership_WhenUserDoesNotOwnIt() {
        stubCurrentUser();
        Application app = makeApplication(otherUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        assertThrows(ResourceOwnershipException.class,
                () -> applicationService.getApplicationCredentials(app.getId()));
    }

    // ── deleteApplicationByUser ───────────────────────────────────────────

    @Test
    void deleteApplication_SetsDeletedAt() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        applicationService.deleteApplicationByUser(app.getId());

        ArgumentCaptor<Application> captor = ArgumentCaptor.forClass(Application.class);
        verify(applicationRepository).save(captor.capture());
        assertNotNull(captor.getValue().getDeletedAt());
    }

    @Test
    void deleteApplication_ThrowsNotFound_WhenIdDoesNotExist() {
        UUID id = UUID.randomUUID();
        when(applicationRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> applicationService.deleteApplicationByUser(id));
    }

    @Test
    void deleteApplication_ThrowsOwnership_WhenUserDoesNotOwnIt() {
        stubCurrentUser();
        Application app = makeApplication(otherUser, Status.APPLIED);
        when(applicationRepository.findById(app.getId())).thenReturn(Optional.of(app));

        assertThrows(ResourceOwnershipException.class,
                () -> applicationService.deleteApplicationByUser(app.getId()));
        verify(applicationRepository, never()).save(any());
    }

    // ── getApplicationStats ───────────────────────────────────────────────

    @Test
    void getStats_ReturnsZeros_WhenNoApplications() {
        stubCurrentUser();
        when(applicationRepository.findByUser(currentUser)).thenReturn(List.of());

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        assertEquals(0, stats.getTotalApplications());
        assertEquals(0.0, stats.getResponseRate());
        // All statuses should be present and zero
        for (Status s : Status.values()) {
            assertEquals(0L, stats.getStatusBreakdown().get(s));
        }
    }

    @Test
    void getStats_CountsStatusBreakdownCorrectly() {
        stubCurrentUser();
        List<Application> apps = List.of(
                makeApplication(currentUser, Status.APPLIED),
                makeApplication(currentUser, Status.APPLIED),
                makeApplication(currentUser, Status.INTERVIEWING),
                makeApplication(currentUser, Status.OFFER),
                makeApplication(currentUser, Status.REJECTED)
        );
        when(applicationRepository.findByUser(currentUser)).thenReturn(apps);

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        assertEquals(5, stats.getTotalApplications());
        assertEquals(2L, stats.getStatusBreakdown().get(Status.APPLIED));
        assertEquals(1L, stats.getStatusBreakdown().get(Status.INTERVIEWING));
        assertEquals(1L, stats.getStatusBreakdown().get(Status.OFFER));
        assertEquals(1L, stats.getStatusBreakdown().get(Status.REJECTED));
        assertEquals(0L, stats.getStatusBreakdown().get(Status.SCREENING));
        assertEquals(0L, stats.getStatusBreakdown().get(Status.WITHDRAWN));
    }

    @Test
    void getStats_CalculatesResponseRate_ExcludingAppliedAndWithdrawn() {
        stubCurrentUser();
        // 2 APPLIED + 1 WITHDRAWN = not responded. 2 responded (SCREENING + REJECTED) out of 5 total.
        List<Application> apps = List.of(
                makeApplication(currentUser, Status.APPLIED),
                makeApplication(currentUser, Status.APPLIED),
                makeApplication(currentUser, Status.WITHDRAWN),
                makeApplication(currentUser, Status.SCREENING),
                makeApplication(currentUser, Status.REJECTED)
        );
        when(applicationRepository.findByUser(currentUser)).thenReturn(apps);

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        // 2 responded / 5 total = 40.0%
        assertEquals(40.0, stats.getResponseRate());
    }

    @Test
    void getStats_ResponseRateIsZero_WhenNoApplications() {
        stubCurrentUser();
        when(applicationRepository.findByUser(currentUser)).thenReturn(List.of());

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        assertEquals(0.0, stats.getResponseRate());
    }

    @Test
    void getStats_MonthlyCountsHaveSixEntries() {
        stubCurrentUser();
        when(applicationRepository.findByUser(currentUser)).thenReturn(List.of());

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        assertEquals(6, stats.getMonthlyApplications().size());
    }

    @Test
    void getStats_MonthlyCountsIncludeCurrentMonth() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        app.setAppliedDate(LocalDate.now());
        when(applicationRepository.findByUser(currentUser)).thenReturn(List.of(app));

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        // Last entry should be current month and have count 1
        var lastMonth = stats.getMonthlyApplications().get(5);
        assertEquals(1, lastMonth.getCount());
    }

    @Test
    void getStats_ExcludesAppsWithNullAppliedDate_FromMonthlyCounts() {
        stubCurrentUser();
        Application app = makeApplication(currentUser, Status.APPLIED);
        app.setAppliedDate(null);
        when(applicationRepository.findByUser(currentUser)).thenReturn(List.of(app));

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        // All monthly counts should be 0
        for (var month : stats.getMonthlyApplications()) {
            assertEquals(0, month.getCount());
        }
    }

    @Test
    void getStats_AllResponseStatuses_AreCountedAsResponded() {
        stubCurrentUser();
        // Each of the four "responded" statuses
        List<Application> apps = List.of(
                makeApplication(currentUser, Status.SCREENING),
                makeApplication(currentUser, Status.INTERVIEWING),
                makeApplication(currentUser, Status.OFFER),
                makeApplication(currentUser, Status.REJECTED)
        );
        when(applicationRepository.findByUser(currentUser)).thenReturn(apps);

        ApplicationStatsResponse stats = applicationService.getApplicationStats();

        // 4 out of 4 = 100%
        assertEquals(100.0, stats.getResponseRate());
    }
}
