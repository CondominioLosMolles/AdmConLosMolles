document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => {
      const section = item.getAttribute("data-section");
      showView(section);
    });
  });
});

function guardarConfiguracion() {
  const tmc = document.getElementById("tmcInput").value;
  localStorage.setItem("config_tmc", tmc);
  alert("Configuración guardada.");
}

function cargarConfiguracion() {
  const tmc = localStorage.getItem("config_tmc");
  if (tmc !== null) document.getElementById("tmcInput").value = tmc;
}
