package com.nadavramon.job_tracker.repository;

import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import com.nadavramon.job_tracker.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.Modifying;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findByUser(User user);

    @Query("SELECT a FROM Application a WHERE a.user = :user " +
            "AND (:search IS NULL OR LOWER(a.companyName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))) " +
            "AND (:status IS NULL OR a.status = :status)")
    Page<Application> findByUserWithFilters(
            @Param("user") User user,
            @Param("search") String search,
            @Param("status") Status status,
            Pageable pageable);

    @Modifying
    @Transactional
    @Query("UPDATE Application a SET a.deletedAt = :now WHERE a.user = :user AND a.deletedAt IS NULL")
    void softDeleteAllByUser(@Param("user") User user, @Param("now") LocalDateTime now);
}
