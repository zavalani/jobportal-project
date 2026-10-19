package jobportal.repository;

import jobportal.entity.Application;
import jobportal.entity.JobOpening;
import jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByCandidate(User candidate);
    List<Application> findByJobOpening(JobOpening jobOpening);
    boolean existsByCandidateAndJobOpening(User candidate, JobOpening jobOpening);
}
