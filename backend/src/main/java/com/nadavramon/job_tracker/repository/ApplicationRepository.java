package com.nadavramon.job_tracker.repository;

import com.nadavramon.job_tracker.entity.Application;
import com.nadavramon.job_tracker.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
    List<Application> findByUser(User user);
}
