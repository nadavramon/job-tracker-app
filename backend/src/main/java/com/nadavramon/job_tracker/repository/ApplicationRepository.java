package com.nadavramon.job_tracker.repository;

import com.nadavramon.job_tracker.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {
}
