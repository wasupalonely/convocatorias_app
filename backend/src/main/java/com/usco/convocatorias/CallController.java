package com.usco.convocatorias;

import com.usco.convocatorias.dto.CallRequest;
import com.usco.convocatorias.dto.CallResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/convocatorias")
public class CallController {

    private static final String ROLE_ADMIN = "ROLE_ADMINISTRADOR";

    private final CallService callService;

    public CallController(CallService callService) {
        this.callService = callService;
    }

    @GetMapping
    public List<CallResponse> getAll(Authentication authentication) {
        return isNotAdmin(authentication) ? callService.findPublished() : callService.findAll();
    }

    @GetMapping("/{id}")
    public CallResponse getById(@PathVariable Long id) {
        return callService.findById(id);
    }

    @PostMapping
    public ResponseEntity<CallResponse> create(@Valid @RequestBody CallRequest request) {
        CallResponse created = callService.create(request);
        return ResponseEntity.created(URI.create("/api/convocatorias/" + created.id())).body(created);
    }

    @PutMapping("/{id}")
    public CallResponse update(@PathVariable Long id, @Valid @RequestBody CallRequest request) {
        return callService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        callService.delete(id);
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }

    private boolean isNotAdmin(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .noneMatch(ROLE_ADMIN::equals);
    }
}
