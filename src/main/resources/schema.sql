create database if not exists gestor_escolar
character set utf8mb4
collate utf8mb4_unicode_ci;

use gestor_escolar;

create table if not exists roles (
    id bigint primary key auto_increment,
    nombre varchar(50) not null unique,
    descripcion varchar(150),
    created_at timestamp not null default current_timestamp
);

create table if not exists usuarios (
    id bigint primary key auto_increment,
    rol_id bigint not null,
    nombre varchar(120) not null,
    email varchar(160) not null unique,
    password varchar(255) not null,
    activo boolean not null default true,
    created_at timestamp not null default current_timestamp,
    constraint fk_usuarios_roles foreign key (rol_id) references roles(id)
);

create table if not exists alumnos (
    id bigint primary key auto_increment,
    usuario_id bigint not null unique,
    matricula varchar(30) not null unique,
    carrera varchar(120),
    semestre int,
    created_at timestamp not null default current_timestamp,
    constraint fk_alumnos_usuarios foreign key (usuario_id) references usuarios(id) on delete cascade
);

create table if not exists materias (
    id bigint primary key auto_increment,
    clave varchar(30) not null unique,
    nombre varchar(120) not null,
    horario varchar(180) not null,
    semestre_recomendado int,
    activa boolean not null default true,
    created_at timestamp not null default current_timestamp
);

alter table materias add column if not exists horario varchar(180) not null default 'Horario por asignar';

create table if not exists periodos (
    id bigint primary key auto_increment,
    nombre varchar(80) not null unique,
    fecha_inicio date not null,
    fecha_fin date not null,
    activo boolean not null default true
);

create table if not exists inscripciones (
    id bigint primary key auto_increment,
    alumno_id bigint not null,
    materia_id bigint not null,
    periodo_id bigint not null,
    estado enum('INSCRITA', 'CURSADA', 'APROBADA', 'REPROBADA', 'BAJA') not null default 'INSCRITA',
    created_at timestamp not null default current_timestamp,
    updated_at timestamp null default null on update current_timestamp,
    constraint fk_inscripciones_alumnos foreign key (alumno_id) references alumnos(id) on delete cascade,
    constraint fk_inscripciones_materias foreign key (materia_id) references materias(id) on delete cascade,
    constraint fk_inscripciones_periodos foreign key (periodo_id) references periodos(id),
    constraint uq_inscripcion unique (alumno_id, materia_id, periodo_id)
);

create table if not exists calificaciones (
    id bigint primary key auto_increment,
    inscripcion_id bigint not null unique,
    calificacion decimal(5,2) not null,
    observaciones varchar(255),
    created_at timestamp not null default current_timestamp,
    updated_at timestamp null default null on update current_timestamp,
    constraint fk_calificaciones_inscripciones foreign key (inscripcion_id) references inscripciones(id) on delete cascade,
    constraint chk_calificacion check (calificacion >= 0 and calificacion <= 10)
);

create table if not exists metricas_academicas (
    id bigint primary key auto_increment,
    alumno_id bigint not null,
    promedio_general decimal(5,2) not null default 0,
    total_materias_inscritas int not null default 0,
    total_materias_cursadas int not null default 0,
    total_materias_aprobadas int not null default 0,
    total_materias_reprobadas int not null default 0,
    riesgo_academico enum('BAJO', 'MEDIO', 'ALTO') not null default 'BAJO',
    updated_at timestamp null default null on update current_timestamp,
    constraint fk_metricas_alumnos foreign key (alumno_id) references alumnos(id) on delete cascade
);

insert ignore into roles (nombre, descripcion) values
('ADMINISTRADOR', 'Usuario encargado de administrar el sistema'),
('ALUMNO', 'Usuario estudiante que consulta su informacion academica');

insert ignore into periodos (nombre, fecha_inicio, fecha_fin, activo) values
('2026-1', '2026-01-01', '2026-04-30', true),
('2026-2', '2026-05-01', '2026-08-31', false),
('2026-3', '2026-09-01', '2026-12-31', false);
