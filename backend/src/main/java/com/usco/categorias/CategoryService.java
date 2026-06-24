package com.usco.categorias;

import com.usco.categorias.domain.Category;
import com.usco.categorias.dto.CategoryRequest;
import com.usco.categorias.dto.CategoryResponse;
import com.usco.categorias.repository.CategoryRepository;
import com.usco.common.exception.BusinessException;
import com.usco.common.exception.DuplicateResourceException;
import com.usco.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> findAll() {
        return categoryRepository.findAll().stream().map(CategoryResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public CategoryResponse findById(Long id) {
        return CategoryResponse.from(getOrThrow(id));
    }

    public CategoryResponse create(CategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Ya existe una categoria con el nombre " + request.name());
        }
        Category category = new Category();
        category.setName(request.name());
        category.setDescription(request.description());
        return CategoryResponse.from(categoryRepository.save(category));
    }

    public CategoryResponse update(Long id, CategoryRequest request) {
        Category category = getOrThrow(id);
        if (!category.getName().equalsIgnoreCase(request.name())
                && categoryRepository.existsByNameIgnoreCase(request.name())) {
            throw new DuplicateResourceException("Ya existe una categoria con el nombre " + request.name());
        }
        category.setName(request.name());
        category.setDescription(request.description());
        return CategoryResponse.from(category);
    }

    public void delete(Long id) {
        Category category = getOrThrow(id);
        long callsUsingIt = categoryRepository.countCallsUsingCategory(id);
        if (callsUsingIt > 0) {
            throw new BusinessException("No se puede eliminar la categoria porque esta asociada a "
                    + callsUsingIt + " convocatoria(s). Desasociela de esas convocatorias antes de eliminarla.");
        }
        categoryRepository.delete(category);
    }

    private Category getOrThrow(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Categoria", id));
    }
}
