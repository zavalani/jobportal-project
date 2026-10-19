package jobportal.repository;

import jobportal.entity.JobOpening;
import jobportal.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobOpeningRepository extends JpaRepository<JobOpening, Long> {
    List<JobOpening> findByIsDeletedFalse();
    List<JobOpening> findByRecruiter(User recruiter);
}
