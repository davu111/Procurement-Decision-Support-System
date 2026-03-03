package com.ecotel.plan_service.repository;

import com.ecotel.plan_service.model.VehiclePlanCrewMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VehiclePlanCrewMemberRepository extends JpaRepository<VehiclePlanCrewMember, Integer> {
    List<VehiclePlanCrewMember> findByVehiclePlanId(String vehiclePlanId);
}
