package com.ecotel.plan_service.service;

import com.ecotel.plan_service.dto.request.*;
import com.ecotel.plan_service.dto.response.*;
import com.ecotel.plan_service.dto.response.transaction.DetailTransactionResponse;
import com.ecotel.plan_service.dto.response.transaction.TransactionResponse;
import com.ecotel.plan_service.dto.response.vehicle.DetailVehicleWarehouseResponse;
import com.ecotel.plan_service.dto.response.vehicle.DetailWarehouseProductResponse;
import com.ecotel.plan_service.dto.response.vehicle.VehicleResponse;
import com.ecotel.plan_service.enums.PlanStatus;
import com.ecotel.plan_service.mapper.*;
import com.ecotel.plan_service.model.*;
import com.ecotel.plan_service.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PlanService {
    private final PlanRepository planRepository;
    private final VehiclePlanRepository vehiclePlanRepository;
    private final VehiclePlanAreaRepository vehiclePlanAreaRepository;
    private final VehiclePlanCrewMemberRepository vehiclePlanCrewMemberRepository;
    private final DetailPlanRepository detailPlanRepository;
    private final DetailPlanWarehouseRepository detailPlanWarehouseRepository;
    private final DetailPlanWarehouseProductRepository detailPlanWarehouseProductRepository;

    private final PlanMapper planMapper;
    private final VehiclePlanMapper vehiclePlanMapper;
    private final VehiclePlanAreaMapper vehiclePlanAreaMapper;
    private final VehiclePlanCrewMemberMapper vehiclePlanCrewMemberMapper;
    private final DetailPlanMapper detailPlanMapper;
    private final DetailPlanWarehouseMapper detailPlanWarehouseMapper;
    private final DetailPlanWarehouseProductMapper detailPlanWarehouseProductMapper;

    private final DriverService driverService;
    private final WarehouseService warehouseService;
    private final ProductService productService;


    // GET FULL PLAN BY PLAN - Fetch all related data
    public FullPlanResponse getFullPlanByPlan(Plan plan) {
        FullPlanResponse fullPlanResponse = planMapper.toFullPlanResponse(plan);
        List<VehiclePlanResponse> vehiclePlanList = fetchVehiclePlans(plan.getId());
        fullPlanResponse.setVehiclePlans(vehiclePlanList);
        return fullPlanResponse;
    }

    // GET ALL PLANS
    public List<FullPlanResponse> getAllPlans() {
        return planRepository.findAll().stream()
                .map(this::getFullPlanByPlan)
                .toList();
    }

    // GET PLAN BY ID
    public FullPlanResponse getPlanById(String planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // GET PLAN BY STATUS
    public List<FullPlanResponse> getPlansByStatus(PlanStatus status) {
        return planRepository.findByPlanStatus(status).stream()
                .map(this::getFullPlanByPlan)
                .toList();
    }

    // GET PLAN BY LICENSE PLATE (START DATE < NOW < END DATE)
    public VehicleResponse getPlansByLicensePlate(String licensePlate) {
        LocalDateTime now = LocalDateTime.now();
//        List<FullPlanResponse> fullPlanResponses = planRepository.findPlansByDateRange(now).stream()
//                .map(plan -> {
//                    List<VehiclePlan> vehiclePlans = vehiclePlanRepository.findByPlanId(plan.getId());
//                    boolean hasLicensePlate = vehiclePlans.stream()
//                            .anyMatch(vp -> vp.getLicensePlate().equalsIgnoreCase(licensePlate));
//                    return hasLicensePlate ? plan : null;
//                })
//                .filter(Objects::nonNull)
//                .map(this::getFullPlanByPlan)
//                .toList();
//        if (fullPlanResponses.isEmpty()) {
//            return null;
//        } else {
//            return fullPlanResponses.getFirst().getId(); // 1 xe chi duoc gan voi 1 plan dang hoat dong
//        }
        List<Plan> plans = planRepository.findPlansByDateRange(now);


        for (Plan plan : plans) {
            VehiclePlan vehiclePlan = vehiclePlanRepository.findByPlanId(plan.getId())
                    .stream()
                    .filter(vp -> vp.getLicensePlate().equalsIgnoreCase(licensePlate))
                    .findFirst()
                    .orElse(null);
            if (vehiclePlan != null) {
                VehicleResponse response = planMapper.toVehicleResponse(plan);
                response.setLicensePlate(vehiclePlan.getLicensePlate());
                response.setDriverId(vehiclePlan.getDriverId());
                response.setDriverName(driverService.getDriverNameById(vehiclePlan.getDriverId()));
                response.setPurpose(vehiclePlan.getPurpose());
                response.setAllowedAreas(fetchVehiclePlanAreas(vehiclePlan.getId()).stream()
                        .map(VehiclePlanAreaResponse::getAreaCode)
                        .collect(Collectors.toList()));
                response.setCrewMembers(fetchVehiclePlanCrewMembers(vehiclePlan.getId()).stream()
                        .map(VehiclePlanCrewMemberResponse::getCrewMemberName)
                        .collect(Collectors.toList()));
                response.setDetails(fetchDetailPlans(vehiclePlan.getId()).stream()
                        .map(detailPlanResponse -> {
                            DetailVehicleWarehouseResponse detailResponse = new DetailVehicleWarehouseResponse();
                            detailResponse.setSequenceOrder(detailPlanResponse.getSequenceOrder());
                            detailResponse.setWorkType(detailPlanResponse.getWorkType());
                            detailResponse.setWarehouseProducts(detailPlanResponse.getWarehouses().stream()
                                    .map(warehouseResponse -> {
                                        DetailWarehouseProductResponse warehouseInfo = new DetailWarehouseProductResponse();
                                        warehouseInfo.setWarehouseId(warehouseResponse.getWarehouseId());
                                        warehouseInfo.setWarehouseName(warehouseService.getWarehouseNameById(warehouseResponse.getWarehouseId()));
                                        Map<String, BigDecimal> productQuantities = new HashMap<>();
                                        warehouseResponse.getProducts().forEach(productResponse -> {
                                            productQuantities.put(
                                                    productService.getProductNameById(productResponse.getProductId()), productResponse.getPlannedQuantity()
                                            );
                                        });
                                        warehouseInfo.setProductQuantities(productQuantities);
                                        return warehouseInfo;
                                    })
                                    .collect(Collectors.toList()));
                            return detailResponse;
                        })
                        .collect(Collectors.toList()));
                return response;
            }
        }
        return null;
    }

    // GET PLAN ID BY LICENSE PLATE (START DATE < NOW < END DATE)
    public String getPlanIdByLicensePlate(String licensePlate) {
        LocalDateTime now = LocalDateTime.now();
        List<Plan> plans = planRepository.findPlansByDateRange(now);

        for (Plan plan : plans) {
            boolean hasLicensePlate = vehiclePlanRepository.findByPlanId(plan.getId()).stream()
                    .anyMatch(vp -> vp.getLicensePlate().equalsIgnoreCase(licensePlate));
            if (hasLicensePlate) {
                return plan.getId(); // 1 xe chi duoc gan voi 1 plan dang hoat dong
            }
        }
        return null;
    }

    // GET PLAN BY LICENSE PLATE AND WAREHOUSE ID TODAY
    public TransactionResponse getPlanByLicensePlateAndWarehouseIdToday(String licensePlate, String warehouseId) {
        LocalDateTime now = LocalDateTime.now();
        List<Plan> plans = planRepository.findPlansByDateRange(now);

        return plans.stream()
                .flatMap(plan -> vehiclePlanRepository.findByPlanId(plan.getId()).stream()
                        .filter(vehiclePlan -> vehiclePlan.getLicensePlate().equalsIgnoreCase(licensePlate))
                        .flatMap(vehiclePlan -> detailPlanRepository.findByVehiclePlanId(vehiclePlan.getId()).stream()
                                .flatMap(detailPlan -> detailPlanWarehouseRepository.findByDetailPlanId(detailPlan.getId()).stream()
                                        .filter(warehouse -> warehouse.getWarehouseId().equalsIgnoreCase(warehouseId))
                                        .map(warehouse -> buildTransactionResponse(plan, vehiclePlan, warehouse))
                                )
                        )
                )
                .findFirst()
                .orElse(null);
    }

    private TransactionResponse buildTransactionResponse(Plan plan, VehiclePlan vehiclePlan, DetailPlanWarehouse warehouse) {
        List<DetailPlanWarehouseProduct> products = detailPlanWarehouseProductRepository.findByDetailPlanWarehouseId(warehouse.getId());

        List<DetailTransactionResponse> detailTransactionResponseList = products.stream()
                .map(product -> {
                    DetailTransactionResponse detail = new DetailTransactionResponse();
                    detail.setProductId(product.getProductId());
                    detail.setProductName(productService.getProductNameById(product.getProductId()));
                    detail.setPlannedQuantity(product.getPlannedQuantity());
                    return detail;
                })
                .collect(Collectors.toList());

        TransactionResponse response = new TransactionResponse();
        response.setPlanId(plan.getId());
        response.setPlanName(plan.getPlanName());
        response.setPlanCode(plan.getPlanCode());
        response.setStartDate(plan.getStartDate());
        response.setEndDate(plan.getEndDate());
        response.setNote(plan.getNote());
        response.setLicensePlate(vehiclePlan.getLicensePlate());
        response.setDriverId(vehiclePlan.getDriverId());
        response.setDriverName(driverService.getDriverNameById(vehiclePlan.getDriverId()));
        response.setDetailTransactionResponses(detailTransactionResponseList);

        return response;
    }

    // Helper method: Fetch all VehiclePlans with related entities
    private List<VehiclePlanResponse> fetchVehiclePlans(String planId) {
        List<VehiclePlan> vehiclePlans = vehiclePlanRepository.findByPlanId(planId);
        return vehiclePlans.stream()
                .map(this::fetchVehiclePlan)
                .toList();
    }

    // Helper method: Fetch single VehiclePlan with all related entities
    private VehiclePlanResponse fetchVehiclePlan(VehiclePlan vehiclePlan) {
        VehiclePlanResponse vehiclePlanResponse = vehiclePlanMapper.toVehiclePlanResponse(vehiclePlan);
        vehiclePlanResponse.setDriverName(driverService.getDriverNameById(vehiclePlan.getDriverId()));
        vehiclePlanResponse.setAllowedAreas(fetchVehiclePlanAreas(vehiclePlan.getId()));
        vehiclePlanResponse.setCrewMembers(fetchVehiclePlanCrewMembers(vehiclePlan.getId()));
        vehiclePlanResponse.setDetailPlans(fetchDetailPlans(vehiclePlan.getId()));
        return vehiclePlanResponse;
    }

    // Helper method: Fetch all VehiclePlanAreas
    private List<VehiclePlanAreaResponse> fetchVehiclePlanAreas(String vehiclePlanId) {
        List<VehiclePlanArea> areas = vehiclePlanAreaRepository.findByVehiclePlanId(vehiclePlanId);
        return areas.stream()
                .map(vehiclePlanAreaMapper::toAreaResponse)
                .toList();
    }

    // Helper method: Fetch all VehiclePlanCrewMembers
    private List<VehiclePlanCrewMemberResponse> fetchVehiclePlanCrewMembers(String vehiclePlanId) {
        List<VehiclePlanCrewMember> crewMembers = vehiclePlanCrewMemberRepository.findByVehiclePlanId(vehiclePlanId);
        return crewMembers.stream()
                .map(vehiclePlanCrewMember -> {
                    VehiclePlanCrewMemberResponse response = vehiclePlanCrewMemberMapper.toVehiclePlanCrewMemberResponse(vehiclePlanCrewMember);
                    response.setCrewMemberName(driverService.getDriverNameById(vehiclePlanCrewMember.getCrewMemberId()));
                    return response;
                })
                .toList();
    }

    // Helper method: Fetch all DetailPlans
    private List<DetailPlanResponse> fetchDetailPlans(String vehiclePlanId) {
        List<DetailPlan> detailPlans = detailPlanRepository.findByVehiclePlanId(vehiclePlanId);
        return detailPlans.stream()
                .map(this::fetchDetailPlan)
                .toList();
    }

    // Helper method: Fetch single DetailPlan with related entities
    private DetailPlanResponse fetchDetailPlan(DetailPlan detailPlan) {
        DetailPlanResponse detailPlanResponse = detailPlanMapper.toDetailPlanResponse(detailPlan);
        detailPlanResponse.setWarehouses(fetchDetailPlanWarehouses(detailPlan.getId()));
        return detailPlanResponse;
    }

    // Helper method: Fetch all DetailPlanWarehouses
    private List<DetailPlanWarehouseResponse> fetchDetailPlanWarehouses(String detailPlanId) {
        List<DetailPlanWarehouse> warehouses = detailPlanWarehouseRepository.findByDetailPlanId(detailPlanId);
        return warehouses.stream()
                .map(this::fetchDetailPlanWarehouse)
                .toList();
    }

    // Helper method: Fetch single DetailPlanWarehouse with related entities
    private DetailPlanWarehouseResponse fetchDetailPlanWarehouse(DetailPlanWarehouse warehouse) {
        DetailPlanWarehouseResponse warehouseResponse = detailPlanWarehouseMapper.toDetailPlanWarehouseResponse(warehouse);
        warehouseResponse.setProducts(fetchDetailPlanWarehouseProducts(warehouse.getId()));
        warehouseResponse.setWarehouseName(warehouseService.getWarehouseNameById(warehouse.getWarehouseId()));
        return warehouseResponse;
    }

    // Helper method: Fetch all DetailPlanWarehouseProducts
    private List<DetailPlanWarehouseProductResponse> fetchDetailPlanWarehouseProducts(String detailPlanWarehouseId) {
        List<DetailPlanWarehouseProduct> products = detailPlanWarehouseProductRepository.findByDetailPlanWarehouseId(detailPlanWarehouseId);
        return products.stream()
                .map(detailPlanWarehouseProduct -> {
                    DetailPlanWarehouseProductResponse response = detailPlanWarehouseProductMapper.toDetailPlanWarehouseProductResponse(detailPlanWarehouseProduct);
                    response.setProductName(productService.getProductNameById(detailPlanWarehouseProduct.getProductId()));
                    return response;
                })
                .toList();
    }

    // CREATE PLAN
    @Transactional // Neu khong co VehiclePlan -> Plan cung khong duoc luu
    public FullPlanResponse createPlan(FullPlanRequest request) {
        Plan savedPlan = savePlan(request);
        List<VehiclePlanResponse> vehiclePlanList = saveVehiclePlans(request.getVehiclePlans(), savedPlan.getId());

        FullPlanResponse fullPlanResponse = planMapper.toFullPlanResponse(savedPlan);
        fullPlanResponse.setVehiclePlans(vehiclePlanList);

        return fullPlanResponse;
    }

    // Helper method: Save Plan
    private Plan savePlan(FullPlanRequest request) {
        Plan plan = planMapper.toPlan(request);
        return planRepository.save(plan);
    }

    // Helper method: Save VehiclePlans
    private List<VehiclePlanResponse> saveVehiclePlans(List<VehiclePlanRequest> vehiclePlanRequests, String planId) {
        return vehiclePlanRequests.stream()
                .map(vehiclePlanRequest -> saveVehiclePlan(vehiclePlanRequest, planId))
                .toList();
    }

    // Helper method: Save single VehiclePlan with related entities
    private VehiclePlanResponse saveVehiclePlan(VehiclePlanRequest vehiclePlanRequest, String planId) {
        VehiclePlan vehiclePlan = vehiclePlanMapper.toVehiclePlan(vehiclePlanRequest);
        vehiclePlan.setPlanId(planId);
        VehiclePlan savedVehiclePlan = vehiclePlanRepository.save(vehiclePlan);

        VehiclePlanResponse vehiclePlanResponse = vehiclePlanMapper.toVehiclePlanResponse(savedVehiclePlan);
        vehiclePlanResponse.setDriverName(driverService.getDriverNameById(vehiclePlanResponse.getDriverId()));
        vehiclePlanResponse.setAllowedAreas(saveVehiclePlanAreas(vehiclePlanRequest.getAllowedAreas(), savedVehiclePlan.getId()));
        vehiclePlanResponse.setCrewMembers(saveVehiclePlanCrewMembers(vehiclePlanRequest.getCrewMembers(), savedVehiclePlan.getId()));
        vehiclePlanResponse.setDetailPlans(saveDetailPlans(vehiclePlanRequest.getDetailPlans(), savedVehiclePlan.getId()));

        return vehiclePlanResponse;
    }

    // Helper method: Save VehiclePlanAreas
    private List<VehiclePlanAreaResponse> saveVehiclePlanAreas(List<VehiclePlanAreaRequest> areaRequests, String vehiclePlanId) {
        return areaRequests.stream()
                .map(areaRequest -> {
                    VehiclePlanArea area = vehiclePlanAreaMapper.toArea(areaRequest);
                    area.setVehiclePlanId(vehiclePlanId);
                    VehiclePlanArea savedArea = vehiclePlanAreaRepository.save(area);
                    return vehiclePlanAreaMapper.toAreaResponse(savedArea);
                })
                .toList();
    }

    // Helper method: Save VehiclePlanCrewMembers
    private List<VehiclePlanCrewMemberResponse> saveVehiclePlanCrewMembers(List<VehiclePlanCrewMemberRequest> crewMemberRequests, String vehiclePlanId) {
        if (crewMemberRequests == null) {
            return new ArrayList<>();
        }

        return crewMemberRequests.stream()
                .map(crewMemberRequest -> {
                    VehiclePlanCrewMember crewMember = vehiclePlanCrewMemberMapper.toVehiclePlanCrewMember(crewMemberRequest);
                    crewMember.setVehiclePlanId(vehiclePlanId);
                    VehiclePlanCrewMember savedCrewMember = vehiclePlanCrewMemberRepository.save(crewMember);
                    VehiclePlanCrewMemberResponse response = vehiclePlanCrewMemberMapper.toVehiclePlanCrewMemberResponse(savedCrewMember);
                    response.setCrewMemberName(driverService.getDriverNameById(savedCrewMember.getCrewMemberId()));
                    return response;
                })
                .toList();
    }

    // Helper method: Save DetailPlans
    private List<DetailPlanResponse> saveDetailPlans(List<DetailPlanRequest> detailPlanRequests, String vehiclePlanId) {
        return detailPlanRequests.stream()
                .map(detailPlanRequest -> saveDetailPlan(detailPlanRequest, vehiclePlanId))
                .toList();
    }

    // Helper method: Save single DetailPlan with related entities
    private DetailPlanResponse saveDetailPlan(DetailPlanRequest detailPlanRequest, String vehiclePlanId) {
        DetailPlan detailPlan = detailPlanMapper.toDetailPlan(detailPlanRequest);
        detailPlan.setVehiclePlanId(vehiclePlanId);
        DetailPlan savedDetailPlan = detailPlanRepository.save(detailPlan);

        DetailPlanResponse detailPlanResponse = detailPlanMapper.toDetailPlanResponse(savedDetailPlan);
        detailPlanResponse.setWarehouses(saveDetailPlanWarehouses(detailPlanRequest.getWarehouses(), savedDetailPlan.getId()));

        return detailPlanResponse;
    }

    // Helper method: Save DetailPlanWarehouses
    private List<DetailPlanWarehouseResponse> saveDetailPlanWarehouses(List<DetailPlanWarehouseRequest> warehouseRequests, String detailPlanId) {
        return warehouseRequests.stream()
                .map(warehouseRequest -> saveDetailPlanWarehouse(warehouseRequest, detailPlanId))
                .toList();
    }

    // Helper method: Save single DetailPlanWarehouse with related entities
    private DetailPlanWarehouseResponse saveDetailPlanWarehouse(DetailPlanWarehouseRequest warehouseRequest, String detailPlanId) {
        DetailPlanWarehouse warehouse = detailPlanWarehouseMapper.toDetailPlanWarehouse(warehouseRequest);
        warehouse.setDetailPlanId(detailPlanId);
        DetailPlanWarehouse savedWarehouse = detailPlanWarehouseRepository.save(warehouse);

        DetailPlanWarehouseResponse warehouseResponse = detailPlanWarehouseMapper.toDetailPlanWarehouseResponse(savedWarehouse);
        warehouseResponse.setProducts(saveDetailPlanWarehouseProducts(warehouseRequest.getProducts(), savedWarehouse.getId()));
        warehouseResponse.setWarehouseName(warehouseService.getWarehouseNameById(savedWarehouse.getWarehouseId()));

        return warehouseResponse;
    }

    // Helper method: Save DetailPlanWarehouseProducts
    private List<DetailPlanWarehouseProductResponse> saveDetailPlanWarehouseProducts(List<DetailPlanWarehouseProductRequest> productRequests, String detailPlanWarehouseId) {
        return productRequests.stream()
                .map(productRequest -> {
                    DetailPlanWarehouseProduct product = detailPlanWarehouseProductMapper.toDetailPlanWarehouseProduct(productRequest);
                    product.setDetailPlanWarehouseId(detailPlanWarehouseId);
                    DetailPlanWarehouseProduct savedProduct = detailPlanWarehouseProductRepository.save(product);

                    DetailPlanWarehouseProductResponse response = detailPlanWarehouseProductMapper.toDetailPlanWarehouseProductResponse(savedProduct);
                    response.setProductName(productService.getProductNameById(savedProduct.getProductId()));
                    return response;
                })
                .toList();
    }

    // ==================== UPDATE METHODS ====================

    // UPDATE PLAN - Delete all children and recreate (Cascade Delete & Recreate strategy)
    @Transactional
    public FullPlanResponse updatePlan(String planId, FullPlanRequest request) {
        Plan existingPlan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));

        if (existingPlan.getStartDate().isBefore(LocalDateTime.now()) || request.getStartDate().isBefore(LocalDateTime.now()))
            return null;

        // Update Plan basic info
        Plan updatedPlan = planMapper.toPlan(request);
        updatedPlan.setId(planId);
        Plan savedPlan = planRepository.save(updatedPlan);

        // Delete all existing VehiclePlans and their related entities
        List<VehiclePlan> existingVehiclePlans = vehiclePlanRepository.findByPlanId(planId);
        existingVehiclePlans.forEach(vehiclePlan -> deleteVehiclePlanCascade(vehiclePlan.getId()));

        // Recreate all VehiclePlans with new data
        List<VehiclePlanResponse> vehiclePlanList = saveVehiclePlans(request.getVehiclePlans(), planId);

        FullPlanResponse fullPlanResponse = planMapper.toFullPlanResponse(savedPlan);
        fullPlanResponse.setVehiclePlans(vehiclePlanList);

        return fullPlanResponse;
    }

    // UPDATE VEHICLE PLAN
    @Transactional
    public FullPlanResponse updateVehiclePlan(String planId, String vehiclePlanId, VehiclePlanRequest request) {
        VehiclePlan existingVehiclePlan = vehiclePlanRepository.findById(vehiclePlanId)
                .orElseThrow(() -> new RuntimeException("VehiclePlan not found with id: " + vehiclePlanId));

        VehiclePlan updatedVehiclePlan = vehiclePlanMapper.toVehiclePlan(request);
        updatedVehiclePlan.setId(vehiclePlanId);
        updatedVehiclePlan.setPlanId(planId);
        vehiclePlanRepository.save(updatedVehiclePlan);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // UPDATE VEHICLE PLAN AREA
    @Transactional
    public FullPlanResponse updateVehiclePlanArea(String planId, Integer vehiclePlanAreaId, VehiclePlanAreaRequest request) {
        VehiclePlanArea existingArea = vehiclePlanAreaRepository.findById(vehiclePlanAreaId)
                .orElseThrow(() -> new RuntimeException("VehiclePlanArea not found with id: " + vehiclePlanAreaId));

        VehiclePlanArea updatedArea = vehiclePlanAreaMapper.toArea(request);
        updatedArea.setId(vehiclePlanAreaId);
        updatedArea.setVehiclePlanId(existingArea.getVehiclePlanId());
        vehiclePlanAreaRepository.save(updatedArea);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // UPDATE VEHICLE PLAN CREW MEMBER
    @Transactional
    public FullPlanResponse updateVehiclePlanCrewMember(String planId, Integer vehiclePlanCrewMemberId, VehiclePlanCrewMemberRequest request) {
        VehiclePlanCrewMember existingCrewMember = vehiclePlanCrewMemberRepository.findById(vehiclePlanCrewMemberId)
                .orElseThrow(() -> new RuntimeException("VehiclePlanCrewMember not found with id: " + vehiclePlanCrewMemberId));

        VehiclePlanCrewMember updatedCrewMember = vehiclePlanCrewMemberMapper.toVehiclePlanCrewMember(request);
        updatedCrewMember.setId(vehiclePlanCrewMemberId);
        updatedCrewMember.setVehiclePlanId(existingCrewMember.getVehiclePlanId());
        vehiclePlanCrewMemberRepository.save(updatedCrewMember);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // UPDATE DETAIL PLAN
    @Transactional
    public FullPlanResponse updateDetailPlan(String planId, String detailPlanId, DetailPlanRequest request) {
        DetailPlan existingDetailPlan = detailPlanRepository.findById(detailPlanId)
                .orElseThrow(() -> new RuntimeException("DetailPlan not found with id: " + detailPlanId));

        DetailPlan updatedDetailPlan = detailPlanMapper.toDetailPlan(request);
        updatedDetailPlan.setId(detailPlanId);
        updatedDetailPlan.setVehiclePlanId(existingDetailPlan.getVehiclePlanId());
        detailPlanRepository.save(updatedDetailPlan);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // UPDATE DETAIL PLAN WAREHOUSE
    @Transactional
    public FullPlanResponse updateDetailPlanWarehouse(String planId, String detailPlanWarehouseId, DetailPlanWarehouseRequest request) {
        DetailPlanWarehouse existingWarehouse = detailPlanWarehouseRepository.findById(detailPlanWarehouseId)
                .orElseThrow(() -> new RuntimeException("DetailPlanWarehouse not found with id: " + detailPlanWarehouseId));

        DetailPlanWarehouse updatedWarehouse = detailPlanWarehouseMapper.toDetailPlanWarehouse(request);
        updatedWarehouse.setId(detailPlanWarehouseId);
        updatedWarehouse.setDetailPlanId(existingWarehouse.getDetailPlanId());
        detailPlanWarehouseRepository.save(updatedWarehouse);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // UPDATE DETAIL PLAN WAREHOUSE PRODUCT
    @Transactional
    public FullPlanResponse updateDetailPlanWarehouseProduct(String planId, String detailPlanWarehouseProductId, DetailPlanWarehouseProductRequest request) {
        DetailPlanWarehouseProduct existingProduct = detailPlanWarehouseProductRepository.findById(detailPlanWarehouseProductId)
                .orElseThrow(() -> new RuntimeException("DetailPlanWarehouseProduct not found with id: " + detailPlanWarehouseProductId));

        DetailPlanWarehouseProduct updatedProduct = detailPlanWarehouseProductMapper.toDetailPlanWarehouseProduct(request);
        updatedProduct.setId(detailPlanWarehouseProductId);
        updatedProduct.setDetailPlanWarehouseId(existingProduct.getDetailPlanWarehouseId());
        detailPlanWarehouseProductRepository.save(updatedProduct);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // ==================== DELETE METHODS ====================

    // DELETE PLAN
    @Transactional
    public void deletePlan(String planId) {
        if (!planRepository.existsById(planId)) {
            throw new RuntimeException("Plan not found with id: " + planId);
        }

        // Delete all VehiclePlans and their related entities
        List<VehiclePlan> vehiclePlans = vehiclePlanRepository.findByPlanId(planId);
        vehiclePlans.forEach(vehiclePlan -> deleteVehiclePlanCascade(vehiclePlan.getId()));

        planRepository.deleteById(planId);
    }

    // DELETE VEHICLE PLAN (with cascade delete of related entities)
    @Transactional
    public FullPlanResponse deleteVehiclePlan(String planId, String vehiclePlanId) {
        if (!vehiclePlanRepository.existsById(vehiclePlanId)) {
            throw new RuntimeException("VehiclePlan not found with id: " + vehiclePlanId);
        }

        deleteVehiclePlanCascade(vehiclePlanId);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // Helper method: Delete VehiclePlan with all related entities
    private void deleteVehiclePlanCascade(String vehiclePlanId) {
        // Delete all VehiclePlanAreas
        List<VehiclePlanArea> areas = vehiclePlanAreaRepository.findByVehiclePlanId(vehiclePlanId);
        vehiclePlanAreaRepository.deleteAll(areas);

        // Delete all VehiclePlanCrewMembers
        List<VehiclePlanCrewMember> crewMembers = vehiclePlanCrewMemberRepository.findByVehiclePlanId(vehiclePlanId);
        vehiclePlanCrewMemberRepository.deleteAll(crewMembers);

        // Delete all DetailPlans with their related entities
        List<DetailPlan> detailPlans = detailPlanRepository.findByVehiclePlanId(vehiclePlanId);
        detailPlans.forEach(detailPlan -> deleteDetailPlanCascade(detailPlan.getId()));

        // Delete VehiclePlan
        vehiclePlanRepository.deleteById(vehiclePlanId);
    }

    // DELETE VEHICLE PLAN AREA
    @Transactional
    public FullPlanResponse deleteVehiclePlanArea(String planId, Integer vehiclePlanAreaId) {
        if (!vehiclePlanAreaRepository.existsById(vehiclePlanAreaId)) {
            throw new RuntimeException("VehiclePlanArea not found with id: " + vehiclePlanAreaId);
        }

        vehiclePlanAreaRepository.deleteById(vehiclePlanAreaId);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // DELETE VEHICLE PLAN CREW MEMBER
    @Transactional
    public FullPlanResponse deleteVehiclePlanCrewMember(String planId, Integer vehiclePlanCrewMemberId) {
        if (!vehiclePlanCrewMemberRepository.existsById(vehiclePlanCrewMemberId)) {
            throw new RuntimeException("VehiclePlanCrewMember not found with id: " + vehiclePlanCrewMemberId);
        }

        vehiclePlanCrewMemberRepository.deleteById(vehiclePlanCrewMemberId);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // DELETE DETAIL PLAN
    @Transactional
    public FullPlanResponse deleteDetailPlan(String planId, String detailPlanId) {
        if (!detailPlanRepository.existsById(detailPlanId)) {
            throw new RuntimeException("DetailPlan not found with id: " + detailPlanId);
        }

        deleteDetailPlanCascade(detailPlanId);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // Helper method: Delete DetailPlan with all related entities
    private void deleteDetailPlanCascade(String detailPlanId) {
        // Delete all DetailPlanWarehouses with their products
        List<DetailPlanWarehouse> warehouses = detailPlanWarehouseRepository.findByDetailPlanId(detailPlanId);
        warehouses.forEach(warehouse -> deleteDetailPlanWarehouseCascade(warehouse.getId()));

        // Delete DetailPlan
        detailPlanRepository.deleteById(detailPlanId);
    }

    // DELETE DETAIL PLAN WAREHOUSE
    @Transactional
    public FullPlanResponse deleteDetailPlanWarehouse(String planId, String detailPlanWarehouseId) {
        if (!detailPlanWarehouseRepository.existsById(detailPlanWarehouseId)) {
            throw new RuntimeException("DetailPlanWarehouse not found with id: " + detailPlanWarehouseId);
        }

        deleteDetailPlanWarehouseCascade(detailPlanWarehouseId);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

    // Helper method: Delete DetailPlanWarehouse with all related entities
    private void deleteDetailPlanWarehouseCascade(String detailPlanWarehouseId) {
        // Delete all DetailPlanWarehouseProducts
        List<DetailPlanWarehouseProduct> products = detailPlanWarehouseProductRepository.findByDetailPlanWarehouseId(detailPlanWarehouseId);
        detailPlanWarehouseProductRepository.deleteAll(products);

        // Delete DetailPlanWarehouse
        detailPlanWarehouseRepository.deleteById(detailPlanWarehouseId);
    }

    // DELETE DETAIL PLAN WAREHOUSE PRODUCT
    @Transactional
    public FullPlanResponse deleteDetailPlanWarehouseProduct(String planId, String detailPlanWarehouseProductId) {
        if (!detailPlanWarehouseProductRepository.existsById(detailPlanWarehouseProductId)) {
            throw new RuntimeException("DetailPlanWarehouseProduct not found with id: " + detailPlanWarehouseProductId);
        }

        detailPlanWarehouseProductRepository.deleteById(detailPlanWarehouseProductId);

        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with id: " + planId));
        return getFullPlanByPlan(plan);
    }

}
