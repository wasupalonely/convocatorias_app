package com.usco.postulaciones;

import com.usco.common.exception.BusinessException;
import com.usco.convocatorias.CallService;
import com.usco.convocatorias.domain.Call;
import com.usco.convocatorias.domain.CallStatus;
import com.usco.postulaciones.domain.Application;
import com.usco.postulaciones.domain.ApplicationStatus;
import com.usco.postulaciones.dto.ApplicationRequest;
import com.usco.postulaciones.dto.StatusChangeRequest;
import com.usco.postulaciones.repository.ApplicationRepository;
import com.usco.security.CurrentUserProvider;
import com.usco.usuarios.domain.Role;
import com.usco.usuarios.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ApplicationServiceTest {

    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private CallService callService;
    @Mock
    private CurrentUserProvider currentUserProvider;

    @InjectMocks
    private ApplicationService applicationService;

    private User applicant;
    private Call call;

    @BeforeEach
    void setUp() {
        applicant = new User();
        applicant.setIdentification("123");
        applicant.setName("Test Applicant");
        applicant.setEmail("applicant@usco.edu.co");
        applicant.setRole(Role.ESTUDIANTE);

        call = new Call();
        call.setName("Monitorias Academicas");
        call.setStartDate(LocalDate.now());
        call.setEndDate(LocalDate.now().plusDays(10));
        call.setAvailableSlots(2);
        call.setStatus(CallStatus.PUBLICADA);
    }

    @Test
    void apply_createsPendingApplication_whenEverythingIsValid() {
        when(currentUserProvider.getCurrentUser()).thenReturn(applicant);
        when(callService.getEntity(anyLong())).thenReturn(call);
        when(applicationRepository.existsByCallIdAndApplicantId(any(), any())).thenReturn(false);
        when(applicationRepository.countByCallIdAndStatusNot(any(), any())).thenReturn(0L);
        when(applicationRepository.save(any(Application.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = applicationService.apply(new ApplicationRequest(1L));

        assertThat(response.status()).isEqualTo(ApplicationStatus.PENDIENTE);
    }

    @Test
    void apply_failsWhenCallIsClosed() {
        call.setStatus(CallStatus.CERRADA);
        when(currentUserProvider.getCurrentUser()).thenReturn(applicant);
        when(callService.getEntity(anyLong())).thenReturn(call);

        assertThatThrownBy(() -> applicationService.apply(new ApplicationRequest(1L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cerrada");
    }

    @Test
    void apply_failsWhenApplicationAlreadyExists() {
        when(currentUserProvider.getCurrentUser()).thenReturn(applicant);
        when(callService.getEntity(anyLong())).thenReturn(call);
        when(applicationRepository.existsByCallIdAndApplicantId(any(), any())).thenReturn(true);

        assertThatThrownBy(() -> applicationService.apply(new ApplicationRequest(1L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Ya existe");
    }

    @Test
    void apply_failsWhenNoSlotsAvailable() {
        when(currentUserProvider.getCurrentUser()).thenReturn(applicant);
        when(callService.getEntity(anyLong())).thenReturn(call);
        when(applicationRepository.existsByCallIdAndApplicantId(any(), any())).thenReturn(false);
        when(applicationRepository.countByCallIdAndStatusNot(any(), any())).thenReturn(2L);

        assertThatThrownBy(() -> applicationService.apply(new ApplicationRequest(1L)))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("cupos");
    }

    @Test
    void updateStatus_failsWhenTryingToSetBackToPending() {
        assertThatThrownBy(() ->
                applicationService.updateStatus(1L, new StatusChangeRequest(ApplicationStatus.PENDIENTE, null)))
                .isInstanceOf(BusinessException.class);
    }
}
