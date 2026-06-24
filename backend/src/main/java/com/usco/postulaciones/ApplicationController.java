package com.usco.postulaciones;

import com.usco.postulaciones.dto.ApplicationRequest;
import com.usco.postulaciones.dto.ApplicationResponse;
import com.usco.postulaciones.dto.StatusChangeRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/postulaciones")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<ApplicationResponse> apply(@Valid @RequestBody ApplicationRequest request) {
        ApplicationResponse created = applicationService.apply(request);
        return ResponseEntity.created(URI.create("/api/postulaciones/" + created.id())).body(created);
    }

    @GetMapping
    public List<ApplicationResponse> getAll() {
        return applicationService.findVisibleForCurrentUser();
    }

    @PutMapping("/{id}/estado")
    public ApplicationResponse updateStatus(@PathVariable Long id, @Valid @RequestBody StatusChangeRequest request) {
        return applicationService.updateStatus(id, request);
    }
}
