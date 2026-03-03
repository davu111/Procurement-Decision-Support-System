package com.ecotel.transaction_service.service;

import com.ecotel.transaction_service.dto.request.InOutDetailRequest;
import com.ecotel.transaction_service.dto.response.InOutDetailResponse;
import com.ecotel.transaction_service.mapper.InOutDetailMapper;
import com.ecotel.transaction_service.model.InOutDetail;
import com.ecotel.transaction_service.model.InOutTransaction;
import com.ecotel.transaction_service.repository.InOutDetailRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class InOutDetailService {
    private final InOutDetailRepository inOutDetailRepository;
    private final InOutDetailMapper inOutDetailMapper;
}
