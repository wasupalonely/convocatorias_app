package com.usco.convocatorias;

import com.usco.categorias.domain.Category;
import com.usco.categorias.repository.CategoryRepository;
import com.usco.common.exception.BusinessException;
import com.usco.common.exception.ResourceNotFoundException;
import com.usco.convocatorias.domain.Call;
import com.usco.convocatorias.domain.CallStatus;
import com.usco.convocatorias.dto.CallRequest;
import com.usco.convocatorias.dto.CallResponse;
import com.usco.convocatorias.dto.SlotCount;
import com.usco.convocatorias.repository.CallRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class CallService {

    private final CallRepository callRepository;
    private final CategoryRepository categoryRepository;

    public CallService(CallRepository callRepository, CategoryRepository categoryRepository) {
        this.callRepository = callRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CallResponse> findAll() {
        return toResponses(callRepository.findAll());
    }

    @Transactional(readOnly = true)
    public List<CallResponse> findPublished() {
        return toResponses(callRepository.findByStatus(CallStatus.PUBLICADA));
    }

    @Transactional(readOnly = true)
    public CallResponse findById(Long id) {
        Call call = getOrThrow(id);
        return CallResponse.from(call, callRepository.countApprovedApplications(id));
    }

    public CallResponse create(CallRequest request) {
        validateDates(request);
        Call call = new Call();
        applyChanges(call, request);
        if (request.status() != null) {
            call.setStatus(request.status());
        }
        // Recien creada: aun no tiene postulaciones aprobadas.
        return CallResponse.from(callRepository.save(call), 0L);
    }

    public CallResponse update(Long id, CallRequest request) {
        validateDates(request);
        Call call = getOrThrow(id);
        applyChanges(call, request);
        if (request.status() != null) {
            call.setStatus(request.status());
        }
        return CallResponse.from(call, callRepository.countApprovedApplications(id));
    }

    // Mapea convocatorias a respuestas resolviendo el conteo de aprobadas en una sola consulta.
    private List<CallResponse> toResponses(List<Call> calls) {
        Map<Long, Long> approvedByCall = callRepository.countApprovedGroupedByCall().stream()
                .collect(Collectors.toMap(SlotCount::getCallId, SlotCount::getTotal));
        return calls.stream()
                .map(call -> CallResponse.from(call, approvedByCall.getOrDefault(call.getId(), 0L)))
                .toList();
    }

    public void delete(Long id) {
        Call call = getOrThrow(id);
        long applications = callRepository.countApplications(id);
        if (applications > 0) {
            throw new BusinessException("No se puede eliminar la convocatoria porque tiene "
                    + applications + " postulacion(es) asociada(s).");
        }
        callRepository.delete(call);
    }

    @Transactional(readOnly = true)
    public Call getEntity(Long id) {
        return getOrThrow(id);
    }

    private void applyChanges(Call call, CallRequest request) {
        call.setName(request.name());
        call.setDescription(request.description());
        call.setStartDate(request.startDate());
        call.setEndDate(request.endDate());
        call.setAvailableSlots(request.availableSlots());
        call.setCategories(resolveCategories(request.categoryIds()));
    }

    private Set<Category> resolveCategories(Set<Long> categoryIds) {
        if (categoryIds == null || categoryIds.isEmpty()) {
            return new HashSet<>();
        }
        List<Category> found = categoryRepository.findAllById(categoryIds);
        if (found.size() != categoryIds.size()) {
            throw new ResourceNotFoundException("Una o mas categorias indicadas no existen");
        }
        return new HashSet<>(found);
    }

    private void validateDates(CallRequest request) {
        if (request.endDate().isBefore(request.startDate())) {
            throw new BusinessException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
    }

    private Call getOrThrow(Long id) {
        return callRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Convocatoria", id));
    }
}
