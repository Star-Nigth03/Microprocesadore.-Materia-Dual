const api = {
    alumnos: "/api/alumnos",
    materias: "/api/materias",
    inscripciones: "/api/inscripciones",
    estadisticas: "/api/estadisticas",
    riesgo: "/api/riesgo-academico",
};

const materiasBase = [
    { clave: "ESP", nombre: "Espanol", horario: "Lunes a viernes | 07:00 - 07:50" },
    { clave: "MAT", nombre: "Matematicas", horario: "Lunes a viernes | 07:50 - 08:40" },
    { clave: "BIO", nombre: "Ciencias - Biologia", horario: "Lunes y miercoles | 08:40 - 09:30" },
    { clave: "FIS", nombre: "Ciencias - Fisica", horario: "Martes y jueves | 08:40 - 09:30" },
    { clave: "QUI", nombre: "Ciencias - Quimica", horario: "Miercoles y viernes | 10:00 - 10:50" },
    { clave: "GEO", nombre: "Geografia", horario: "Martes y jueves | 10:50 - 11:40" },
    { clave: "HIS", nombre: "Historia", horario: "Lunes, miercoles y viernes | 10:50 - 11:40" },
    { clave: "FCE", nombre: "Formacion Civica y Etica", horario: "Lunes y jueves | 12:10 - 13:00" },
    { clave: "ART", nombre: "Artes", horario: "Martes y jueves | 13:00 - 13:45" },
    { clave: "EDF", nombre: "Educacion Fisica", horario: "Miercoles y viernes | 13:00 - 13:45" },
    { clave: "TUT", nombre: "Tutoria", horario: "Viernes | 13:45 - 14:30" },
    { clave: "ESO", nombre: "Educacion Socioemocional", horario: "Lunes y miercoles | 13:45 - 14:30" },
    { clave: "TEC", nombre: "Tecnologia", horario: "Martes y jueves | 12:10 - 13:00" },
    { clave: "ING-A1", nombre: "Ingles A1", horario: "Lunes a viernes | 10:00 - 10:50" },
    { clave: "ING-A2", nombre: "Ingles A2", horario: "Lunes a viernes | 10:00 - 10:50" },
    { clave: "ING-B1", nombre: "Ingles B1", horario: "Lunes a viernes | 10:00 - 10:50" },
    { clave: "ING-B2", nombre: "Ingles B2", horario: "Lunes a viernes | 10:00 - 10:50" },
    { clave: "ING-C1", nombre: "Ingles C1", horario: "Lunes a viernes | 10:00 - 10:50" },
    { clave: "ING-C2", nombre: "Ingles C2", horario: "Lunes a viernes | 10:00 - 10:50" },
];

const horariosEscolares = [
    "Lunes a viernes | 07:00 - 07:50",
    "Lunes a viernes | 07:50 - 08:40",
    "Lunes a viernes | 08:40 - 09:30",
    "Lunes a viernes | 10:00 - 10:50",
    "Lunes a viernes | 10:50 - 11:40",
    "Lunes a viernes | 12:10 - 13:00",
    "Lunes a viernes | 13:00 - 13:45",
    "Lunes a viernes | 13:45 - 14:30",
    "Lunes y miercoles | 08:40 - 09:30",
    "Martes y jueves | 08:40 - 09:30",
    "Miercoles y viernes | 10:00 - 10:50",
    "Lunes, miercoles y viernes | 10:50 - 11:40",
    "Martes y jueves | 10:50 - 11:40",
    "Lunes y jueves | 12:10 - 13:00",
    "Martes y jueves | 12:10 - 13:00",
    "Martes y jueves | 13:00 - 13:45",
    "Miercoles y viernes | 13:00 - 13:45",
    "Viernes | 13:45 - 14:30",
];

let alumnos = [];
let materias = [];
let estadisticasActuales = null;
let rolActual = null;
let resumenesAlumnos = [];
let inscripcionesPorMateria = new Map();

const $ = (id) => document.getElementById(id);

function escapar(valor) {
    return String(valor ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function textoCalificacion(valor) {
    return valor === null || valor === undefined ? "Sin calificacion" : Number(valor).toFixed(2);
}

function mostrarMensaje(mensaje) {
    $("mensaje").textContent = mensaje;
}

async function solicitud(url, opciones = {}) {
    const respuesta = await fetch(url, {
        headers: { "Content-Type": "application/json" },
        ...opciones,
    });

    if (!respuesta.ok) {
        let mensaje = `Error ${respuesta.status}`;
        try {
            const cuerpo = await respuesta.json();
            mensaje = cuerpo.detail || cuerpo.message || mensaje;
        } catch {
            // Algunas respuestas de error pueden no traer cuerpo JSON.
        }
        throw new Error(mensaje);
    }

    if (respuesta.status === 204) {
        return null;
    }

    return respuesta.json();
}

function configurarMateriasBase() {
    $("subject-chips").innerHTML = materiasBase
        .map((materia) => `<span class="chip">${escapar(materia.nombre)}</span>`)
        .join("");

    $("materias-base-list").innerHTML = materiasBase
        .map((materia) => `<option value="${escapar(materia.nombre)}"></option>`)
        .join("");

    $("horarios-list").innerHTML = horariosEscolares
        .map((horario) => `<option value="${escapar(horario)}"></option>`)
        .join("");
}

function cambiarVistaPorRol(rol) {
    rolActual = rol;
    $("login-view").classList.add("hidden");
    $("dashboard-view").classList.remove("hidden");
    $("panel-role").textContent = rol === "profesor" ? "Panel del profesor" : "Panel del alumno";

    document.querySelectorAll(".teacher-only").forEach((elemento) => {
        elemento.classList.toggle("hidden", rol !== "profesor");
    });

    activarTab(rol === "profesor" ? "resumen" : "calificaciones");
    mostrarMensaje("");
}

function activarTab(tab) {
    document.querySelectorAll(".tab").forEach((boton) => {
        boton.classList.toggle("active", boton.dataset.tab === tab);
    });
    document.querySelectorAll(".panel-section").forEach((seccion) => {
        seccion.classList.toggle("active", seccion.id === `tab-${tab}`);
    });
}

function mostrarFilaVacia(tbodyId, columnas, mensaje) {
    $(tbodyId).innerHTML = `<tr><td colspan="${columnas}">${escapar(mensaje)}</td></tr>`;
}

async function cargarAlumnos() {
    alumnos = await solicitud(api.alumnos);

    if (alumnos.length === 0) {
        mostrarFilaVacia("alumnos-table", 4, "Todavia no hay alumnos registrados.");
    } else {
        $("alumnos-table").innerHTML = alumnos.map((alumno) => `
            <tr>
                <td>${escapar(alumno.matricula)}</td>
                <td>${escapar(alumno.nombre)}</td>
                <td>${escapar(alumno.email || "")}</td>
                <td>
                    <div class="row-actions">
                        <button type="button" class="mini-button" onclick="editarAlumno(${alumno.id})">Editar</button>
                        <button type="button" class="mini-button danger-button" onclick="eliminarAlumno(${alumno.id})">Eliminar</button>
                    </div>
                </td>
            </tr>
        `).join("");
    }

    const opciones = alumnos
        .map((alumno) => `<option value="${alumno.id}">${escapar(alumno.matricula)} - ${escapar(alumno.nombre)}</option>`)
        .join("");
    $("inscripcion-alumno").innerHTML = opciones;
    $("historial-alumno").innerHTML = opciones;
}

async function cargarMaterias() {
    materias = await solicitud(api.materias);

    const opciones = materias
        .map((materia) => `<option value="${materia.id}">${escapar(materia.clave)} - ${escapar(materia.nombre)}</option>`)
        .join("");
    $("inscripcion-materia").innerHTML = opciones;

    renderizarCursos();
}

function renderizarCursos() {
    if (materias.length === 0) {
        $("courses-list").innerHTML = '<p>No hay cursos registrados. Puedes agregar las materias base de preparatoria.</p>';
        return;
    }

    $("courses-list").innerHTML = materias.map((materia) => {
        const inscritos = inscripcionesPorMateria.get(materia.id) || [];
        const listaInscritos = inscritos.length === 0
            ? "Sin alumnos inscritos"
            : inscritos.map((alumno) => escapar(alumno.nombre)).join(", ");
        return `
            <article class="course-item">
                <h3>${escapar(materia.nombre)}</h3>
                <p>Clave: ${escapar(materia.clave)}</p>
                <p>Horario: ${escapar(materia.horario)}</p>
                <p>Alumnos inscritos: ${inscritos.length}</p>
                <p>${listaInscritos}</p>
                <div class="row-actions">
                    <button type="button" class="mini-button" onclick="editarMateria(${materia.id})">Editar</button>
                    <button type="button" class="mini-button danger-button" onclick="eliminarMateria(${materia.id})">Eliminar</button>
                </div>
            </article>
        `;
    }).join("");
}

function editarAlumno(id) {
    const alumno = alumnos.find((registro) => registro.id === id);
    if (!alumno) return;
    $("alumno-id").value = alumno.id;
    $("alumno-matricula").value = alumno.matricula;
    $("alumno-nombre").value = alumno.nombre;
    $("alumno-email").value = alumno.email || "";
    activarTab("alumnos");
}

async function eliminarAlumno(id) {
    await ejecutar(async () => {
        await solicitud(`${api.alumnos}/${id}`, { method: "DELETE" });
        await actualizarCatalogos();
        await cargarTablero();
        mostrarMensaje("Alumno eliminado");
    });
}

function editarMateria(id) {
    const materia = materias.find((registro) => registro.id === id);
    if (!materia) return;
    $("materia-id").value = materia.id;
    $("materia-clave").value = materia.clave;
    $("materia-nombre").value = materia.nombre;
    $("materia-horario").value = materia.horario;
    activarTab("cursos");
}

async function eliminarMateria(id) {
    await ejecutar(async () => {
        await solicitud(`${api.materias}/${id}`, { method: "DELETE" });
        await actualizarCatalogos();
        await cargarTablero();
        mostrarMensaje("Curso eliminado");
    });
}

async function cargarHistorial() {
    const alumnoId = $("historial-alumno").value;
    if (!alumnoId) {
        $("alumno-resumen").textContent = "Registra un alumno para consultar historial.";
        $("historial-table").innerHTML = "";
        return;
    }

    const historial = await solicitud(`${api.alumnos}/${alumnoId}/historial`);
    const resumen = historial.resumen;
    $("alumno-resumen").textContent =
        `Promedio: ${textoCalificacion(resumen.promedioGeneral)} | Materias: ${resumen.totalMaterias} | ` +
        `Aprobadas: ${resumen.materiasAprobadas} | Riesgo academico: ${resumen.enRiesgoAcademico ? "Si" : "No"}`;

    if (historial.materias.length === 0) {
        mostrarFilaVacia("historial-table", rolActual === "profesor" ? 5 : 4, "El alumno no tiene materias inscritas.");
        renderizarAvanceAcademico([resumen]);
        return;
    }

    $("historial-table").innerHTML = historial.materias.map((registro) => {
        const calificacion = rolActual === "profesor"
            ? `<input id="calificacion-${registro.id}" type="number" min="0" max="10" step="0.1" value="${registro.calificacion ?? ""}">`
            : escapar(textoCalificacion(registro.calificacion));
        const accion = rolActual === "profesor"
            ? `<td><button type="button" class="mini-button" onclick="guardarCalificacion(${registro.id})">Guardar</button></td>`
            : "";

        return `
            <tr>
                <td>${escapar(registro.materiaClave)} - ${escapar(registro.materiaNombre)}</td>
                <td>${escapar(registro.horario)}</td>
                <td>${calificacion}</td>
                <td>${registro.aprobada ? "Aprobada" : "No aprobada"}</td>
                ${accion}
            </tr>
        `;
    }).join("");

    renderizarAvanceAcademico([resumen]);
}

async function guardarCalificacion(inscripcionId) {
    await ejecutar(async () => {
        const valor = Number($(`calificacion-${inscripcionId}`).value);
        await solicitud(`${api.inscripciones}/${inscripcionId}/calificacion`, {
            method: "PUT",
            body: JSON.stringify({ calificacion: valor }),
        });
        await cargarHistorial();
        await cargarTablero();
        mostrarMensaje("Calificacion actualizada");
    });
}

async function cargarEstadisticas() {
    estadisticasActuales = await solicitud(api.estadisticas);
    $("stat-alumnos").textContent = estadisticasActuales.totalAlumnos;
    $("stat-materias").textContent = estadisticasActuales.totalMaterias;
    $("stat-inscripciones").textContent = estadisticasActuales.totalInscripciones;
    $("stat-riesgo").textContent = estadisticasActuales.alumnosEnRiesgo;
}

async function cargarRiesgo() {
    const riesgo = await solicitud(api.riesgo);
    if (riesgo.length === 0) {
        mostrarFilaVacia("riesgo-table", 4, "No hay alumnos en riesgo academico.");
    } else {
        $("riesgo-table").innerHTML = riesgo.map((registro) => `
            <tr>
                <td>${escapar(registro.alumno.matricula)}</td>
                <td>${escapar(registro.alumno.nombre)}</td>
                <td>${textoCalificacion(registro.promedioGeneral)}</td>
                <td>${registro.totalMaterias}</td>
            </tr>
        `).join("");
    }
    renderizarAvanceAcademico(riesgo);
}

async function cargarResumenesAcademicos() {
    resumenesAlumnos = [];
    inscripcionesPorMateria = new Map();

    for (const alumno of alumnos) {
        try {
            const historial = await solicitud(`${api.alumnos}/${alumno.id}/historial`);
            resumenesAlumnos.push(historial.resumen);
            historial.materias.forEach((inscripcion) => {
                const lista = inscripcionesPorMateria.get(inscripcion.materiaId) || [];
                lista.push(alumno);
                inscripcionesPorMateria.set(inscripcion.materiaId, lista);
            });
        } catch {
            resumenesAlumnos.push({
                alumno,
                totalMaterias: 0,
                materiasAprobadas: 0,
                promedioGeneral: null,
                enRiesgoAcademico: false,
            });
        }
    }

    renderizarCursos();
    renderizarAvanceAcademico(resumenesAlumnos);
}

function renderizarAvanceAcademico(resumenes) {
    if (!resumenes || resumenes.length === 0) {
        $("horarios-listado").innerHTML = '<p>No hay horarios para mostrar.</p>';
        return;
    }

    $("horarios-listado").innerHTML = resumenes.map((resumen) => {
        const total = Number(resumen.totalMaterias) || 0;
        const aprobadas = Number(resumen.materiasAprobadas) || 0;
        const avance = total === 0 ? 0 : Math.round((aprobadas / total) * 100);
        return `
            <article class="credit-card">
                <h3>${escapar(resumen.alumno.nombre)}</h3>
                <p>Matricula: ${escapar(resumen.alumno.matricula)}</p>
                <p>Materias aprobadas: ${aprobadas} de ${total}</p>
                <p>Promedio: ${textoCalificacion(resumen.promedioGeneral)}</p>
                <div class="progress" aria-label="Avance academico ${avance}%"><span style="width: ${avance}%"></span></div>
            </article>
        `;
    }).join("");
}

async function agregarMateriasBase() {
    await ejecutar(async () => {
        const clavesExistentes = new Set(materias.map((materia) => materia.clave.toUpperCase()));
        const pendientes = materiasBase.filter((materia) => !clavesExistentes.has(materia.clave));

        for (const materia of pendientes) {
            await solicitud(api.materias, {
                method: "POST",
                body: JSON.stringify(materia),
            });
        }

        await cargarMaterias();
        await cargarEstadisticas();
        mostrarMensaje(pendientes.length === 0 ? "Las materias base ya estaban registradas." : "Materias base agregadas.");
    });
}

async function actualizarCatalogos() {
    await Promise.all([cargarAlumnos(), cargarMaterias()]);
}

async function cargarTablero() {
    await Promise.all([cargarEstadisticas(), cargarRiesgo()]);
    await cargarHistorial();
    await cargarResumenesAcademicos();
}

async function ejecutar(accion) {
    try {
        await accion();
    } catch (error) {
        mostrarMensaje(error.message);
    }
}

document.querySelectorAll("[data-role]").forEach((boton) => {
    boton.addEventListener("click", () => cambiarVistaPorRol(boton.dataset.role));
});

document.querySelectorAll(".tab").forEach((boton) => {
    boton.addEventListener("click", () => activarTab(boton.dataset.tab));
});

$("logout-btn").addEventListener("click", () => {
    rolActual = null;
    $("dashboard-view").classList.add("hidden");
    $("login-view").classList.remove("hidden");
});

$("alumno-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    await ejecutar(async () => {
        const id = $("alumno-id").value;
        const cuerpo = {
            matricula: $("alumno-matricula").value,
            nombre: $("alumno-nombre").value,
            email: $("alumno-email").value || null,
        };
        await solicitud(id ? `${api.alumnos}/${id}` : api.alumnos, {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(cuerpo),
        });
        evento.target.reset();
        $("alumno-id").value = "";
        await actualizarCatalogos();
        await cargarTablero();
        mostrarMensaje("Alumno guardado");
    });
});

$("materia-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    await ejecutar(async () => {
        const id = $("materia-id").value;
        const cuerpo = {
            clave: $("materia-clave").value,
            nombre: $("materia-nombre").value,
            horario: $("materia-horario").value,
        };
        await solicitud(id ? `${api.materias}/${id}` : api.materias, {
            method: id ? "PUT" : "POST",
            body: JSON.stringify(cuerpo),
        });
        evento.target.reset();
        $("materia-id").value = "";
        await actualizarCatalogos();
        await cargarTablero();
        mostrarMensaje("Curso guardado");
    });
});

$("inscripcion-form").addEventListener("submit", async (evento) => {
    evento.preventDefault();
    await ejecutar(async () => {
        await solicitud(api.inscripciones, {
            method: "POST",
            body: JSON.stringify({
                alumnoId: Number($("inscripcion-alumno").value),
                materiaId: Number($("inscripcion-materia").value),
            }),
        });
        await cargarHistorial();
        await cargarTablero();
        mostrarMensaje("Inscripcion registrada");
    });
});

$("alumno-cancel").addEventListener("click", () => {
    $("alumno-form").reset();
    $("alumno-id").value = "";
});

$("materia-cancel").addEventListener("click", () => {
    $("materia-form").reset();
    $("materia-id").value = "";
});

$("load-historial").addEventListener("click", () => ejecutar(cargarHistorial));
$("load-riesgo").addEventListener("click", () => ejecutar(cargarRiesgo));
$("seed-subjects").addEventListener("click", agregarMateriasBase);

configurarMateriasBase();
ejecutar(async () => {
    await actualizarCatalogos();
    await cargarTablero();
});
