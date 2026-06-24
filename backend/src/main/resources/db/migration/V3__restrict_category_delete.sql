ALTER TABLE dbo.convocatoria_categoria DROP CONSTRAINT FK_conv_cat_categoria;

ALTER TABLE dbo.convocatoria_categoria
    ADD CONSTRAINT FK_conv_cat_categoria FOREIGN KEY (categoria_id)
        REFERENCES dbo.categorias (id);
