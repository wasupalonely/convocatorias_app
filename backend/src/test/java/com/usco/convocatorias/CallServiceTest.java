package com.usco.convocatorias;

import com.usco.categorias.repository.CategoryRepository;
import com.usco.common.exception.BusinessException;
import com.usco.convocatorias.domain.Call;
import com.usco.convocatorias.repository.CallRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CallServiceTest {

    @Mock
    private CallRepository callRepository;
    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CallService callService;

    @Test
    void delete_failsWhenCallHasApplications() {
        when(callRepository.findById(1L)).thenReturn(Optional.of(new Call()));
        when(callRepository.countApplications(1L)).thenReturn(2L);

        assertThatThrownBy(() -> callService.delete(1L))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("2 postulacion");

        verify(callRepository, never()).delete(any());
    }

    @Test
    void delete_succeedsWhenCallHasNoApplications() {
        Call call = new Call();
        when(callRepository.findById(1L)).thenReturn(Optional.of(call));
        when(callRepository.countApplications(1L)).thenReturn(0L);

        callService.delete(1L);

        verify(callRepository, times(1)).delete(call);
    }
}
