package com.usco.postulaciones;

import com.usco.common.exception.BusinessException;
import com.usco.common.exception.ResourceNotFoundException;
import com.usco.convocatorias.CallService;
import com.usco.convocatorias.domain.Call;
import com.usco.convocatorias.domain.CallStatus;
import com.usco.postulaciones.domain.Application;
import com.usco.postulaciones.domain.ApplicationStatus;
import com.usco.postulaciones.dto.ApplicationRequest;
import com.usco.postulaciones.dto.ApplicationResponse;
import com.usco.postulaciones.dto.StatusChangeRequest;
import com.usco.postulaciones.repository.ApplicationRepository;
import com.usco.security.CurrentUserProvider;
import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final CallService callService;
    private final CurrentUserProvider currentUserProvider;

    public ApplicationService(ApplicationRepository applicationRepository,
                              CallService callService,
                              CurrentUserProvider currentUserProvider) {
        this.applicationRepository = applicationRepository;
        this.callService = callService;
        this.currentUserProvider = currentUserProvider;
    }

    public ApplicationResponse apply(ApplicationRequest request) {
        User applicant = currentUserProvider.getCurrentUser();
        Call call = callService.getEntity(request.callId());

        validateCallIsOpen(call);
        validateNotDuplicated(call.getId(), applicant.getId());
        validateSlotsAvailable(call);

        Application application = new Application();
        application.setCall(call);
        application.setApplicant(applicant);
        application.setStatus(ApplicationStatus.PENDIENTE);

        return ApplicationResponse.from(applicationRepository.save(application));
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> findVisibleForCurrentUser() {
        User currentUser = currentUserProvider.getCurrentUser();
        List<Application> applications = currentUser.getRole() == Role.ADMINISTRADOR
                ? applicationRepository.findAllByOrderByAppliedAtDesc()
                : applicationRepository.findByApplicantIdOrderByAppliedAtDesc(currentUser.getId());
        return applications.stream().map(ApplicationResponse::from).toList();
    }

    public ApplicationResponse updateStatus(Long id, StatusChangeRequest request) {
        if (request.status() == ApplicationStatus.PENDIENTE) {
            throw new BusinessException("Solo puede cambiarse el estado a APROBADA o RECHAZADA");
        }

        Application application = applicationRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Postulacion", id));

        if (request.status() == ApplicationStatus.APROBADA) {
            validateSlotForApproval(application);
        }

        application.setStatus(request.status());
        application.setObservation(request.observation());
        return ApplicationResponse.from(application);
    }

    private void validateCallIsOpen(Call call) {
        if (call.getStatus() == CallStatus.CERRADA) {
            throw new BusinessException("No es posible postularse a una convocatoria cerrada");
        }
        if (call.getStatus() != CallStatus.PUBLICADA) {
            throw new BusinessException("La convocatoria no esta publicada");
        }
    }

    private void validateNotDuplicated(Long callId, Long applicantId) {
        if (applicationRepository.existsByCallIdAndApplicantId(callId, applicantId)) {
            throw new BusinessException("Ya existe una postulacion suya para esta convocatoria");
        }
    }

    private void validateSlotsAvailable(Call call) {
        // El cupo se consume al APROBAR, no al postularse: se permite postular mientras
        // queden cupos por asignar. La seleccion final la decide el administrador.
        long approved = applicationRepository.countByCallIdAndStatus(call.getId(), ApplicationStatus.APROBADA);
        if (approved >= call.getAvailableSlots()) {
            throw new BusinessException("Los cupos de esta convocatoria ya fueron asignados");
        }
    }

    private void validateSlotForApproval(Application application) {
        if (application.getStatus() == ApplicationStatus.APROBADA) {
            return; // already approved, does not consume a new slot
        }
        long approved = applicationRepository.countByCallIdAndStatus(
                application.getCall().getId(), ApplicationStatus.APROBADA);
        if (approved >= application.getCall().getAvailableSlots()) {
            throw new BusinessException("No hay cupos disponibles para aprobar mas postulaciones");
        }
    }
}
