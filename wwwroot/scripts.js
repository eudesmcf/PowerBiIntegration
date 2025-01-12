// Variáveis para sessão
let sessionStartTime = null; // Armazena o horário de início da sessão
let sessionTimerInterval = null; // Intervalo para atualizar o tempo de sessão

// Seletores do modal
const modal = document.getElementById("modal");
const modalCloseButton = document.getElementById("modalClose");
const modalSaveButton = document.getElementById("modalSave");
let codeEditor; // CodeMirror editor
let currentConsultaIndicator = null; // Bolinha que disparou o modal
let currentConsultaRow = null; // Linha associada ao editor

// Alternar tema claro e escuro
document.getElementById("toggleTheme").addEventListener("click", () => {
    const body = document.body;

    if (body.classList.contains("dark")) {
        body.classList.remove("dark");
        body.classList.add("light");
        document.getElementById("toggleTheme").textContent = "Switch to Dark Theme";
    } else {
        body.classList.remove("light");
        body.classList.add("dark");
        document.getElementById("toggleTheme").textContent = "Switch to Light Theme";
    }
});

// Função para buscar os workspaces da API
async function fetchWorkspaces() {
    try {
        const response = await fetch("/api/powerbi/workspaces");
        if (!response.ok) {
            throw new Error(`Failed to fetch workspaces: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Workspaces Data:", data);

        populateTable(data.value); // Popula a tabela com os dados retornados
    } catch (error) {
        console.error("Error fetching workspaces:", error);
        alert("Failed to fetch workspaces. Check console for details.");
    }
}

// Função para popular a tabela com os dados da API
function populateTable(data) {
    const tableBody = document.getElementById("groupsTable").querySelector("tbody");
    tableBody.innerHTML = ""; // Limpa os dados existentes

    data.forEach((workspace) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${workspace.id}</td><td>${workspace.name}</td>`;
        tableBody.appendChild(row);
    });
}

// Botão "Get Workspaces"
document.getElementById("fetchGroups").addEventListener("click", fetchWorkspaces);

// Botão "Get Access Token"
document.getElementById("fetchToken").addEventListener("click", async () => {
    try {
        const response = await fetch("/api/powerbi/token");
        if (!response.ok) {
            throw new Error(`Failed to fetch token: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Access Token:", data.accessToken);
        // alert("Access Token fetched successfully!");
        startSessionTimer(); // Inicia o timer da sessão
    } catch (error) {
        console.error("Error fetching token:", error);
        alert("Failed to fetch token. Check console for details.");
    }
});

// Iniciar o timer da sessão
function startSessionTimer() {
    sessionStartTime = new Date();

    if (sessionTimerInterval) {
        clearInterval(sessionTimerInterval);
    }

    sessionTimerInterval = setInterval(updateSessionTimer, 1000);
}

// Atualizar o tempo de sessão
function updateSessionTimer() {
    if (!sessionStartTime) return;

    const currentTime = new Date();
    const elapsedTime = new Date(currentTime - sessionStartTime);

    const hours = String(elapsedTime.getUTCHours()).padStart(2, "0");
    const minutes = String(elapsedTime.getUTCMinutes()).padStart(2, "0");
    const seconds = String(elapsedTime.getUTCSeconds()).padStart(2, "0");

    document.getElementById("sessionTime").textContent = `${hours}:${minutes}:${seconds}`;
}

// Alternar entre guias
document.getElementById("monitoringTab").addEventListener("click", () => {
    showPage("monitoringPage", "monitoringTab");
});

document.getElementById("workspacesTab").addEventListener("click", () => {
    showPage("workspacesPage", "workspacesTab");
});

function showPage(pageId, tabId) {
    document.querySelectorAll(".page").forEach((page) => {
        page.classList.add("hidden");
        page.classList.remove("active");
    });

    document.querySelectorAll("#navigation li a").forEach((tab) => {
        tab.classList.remove("active");
    });

    document.getElementById(pageId).classList.remove("hidden");
    document.getElementById(pageId).classList.add("active");
    document.getElementById(tabId).classList.add("active");
}

// Definir a guia inicial ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    showPage("monitoringPage", "monitoringTab"); // Altere para a guia desejada
});


// Adicionar endereço na tabela de monitoramento
let addressId = 1;


// Adicionar múltiplos endereços à tabela de monitoramento
document.getElementById("addAddress").addEventListener("click", () => {
    const addressInput = document.getElementById("monitorAddress");
    const addressValues = addressInput.value.trim();

    if (addressValues === "") {
        alert("Por favor, insira um ou mais endereços válidos.");
        return;
    }

    const urls = addressValues.split(/[\s,]+/).filter((url) => url);

    urls.forEach((url) => {
        addLinkToTable(url);
    });

    addressInput.value = ""; // Limpar o campo de entrada
});


// Função para identificar o tipo com base na URL
function getTypeFromUrl(url) {
    if (url.includes("/datasets/")) {
        return "Dataset";
    } else if (url.includes("/dataflows/")) {
        return "Dataflow";
    } else {
        return "Desconhecido";
    }
}

// Inicializar CodeMirror
document.addEventListener("DOMContentLoaded", () => {
    const editorElement = document.getElementById("editor");

    codeEditor = CodeMirror.fromTextArea(editorElement, {
        lineNumbers: false,
        mode: "sql",
        theme: "dracula",
        matchBrackets: true,
        autoCloseBrackets: true,
    });

    codeEditor.setSize("100%", "300px");
});

// Abrir Modal
function openModal(indicator, row) {
    currentConsultaIndicator = indicator;
    currentConsultaRow = row;

    // Recupera a consulta existente ou inicia com vazio
    const consulta = currentConsultaRow.dataset.consulta || "";
    codeEditor.setValue(consulta); // Preenche o editor com a consulta existente

    modal.classList.remove("hidden"); // Mostra o modal
    codeEditor.refresh(); // Garante que o editor renderize corretamente
    codeEditor.focus(); // Dá foco ao editor
}

// Fechar Modal
function closeModal() {
    modal.classList.add("hidden"); // Esconde o modal

    // Limpa o editor e reseta variáveis após fechar
    setTimeout(() => {
        codeEditor.setValue(""); // Garante que o editor seja limpo
        currentConsultaIndicator = null;
        currentConsultaRow = null;
    }, 300); // Aguarda o fechamento visual do modal
}

// Salvar Dados do Editor
modalSaveButton.addEventListener("click", () => {
    const consulta = codeEditor.getValue().trim();

    if (currentConsultaIndicator && currentConsultaRow) {
        // Atualiza a cor da bolinha com base na presença da consulta
        currentConsultaIndicator.style.backgroundColor = consulta ? "green" : "gray";
        currentConsultaRow.dataset.consulta = consulta; // Salva a consulta na linha
    }

    closeModal(); // Fecha o modal e limpa o editor
});

// Fechar o modal no botão de fechar
modalCloseButton.addEventListener("click", closeModal);


document.getElementById("exportJson").addEventListener("click", () => {
    const tableBody = document.getElementById("monitorTable").querySelector("tbody");
    const rows = tableBody.querySelectorAll("tr");
    const data = [];

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        const hiddenTags = row.querySelector(".hidden-tags")?.textContent.trim() || ""; // Recupera as tags ocultas
        const tagsArray = hiddenTags ? hiddenTags.split(",") : []; // Converte a string em array de tags

        const jsonData = {
            id: cells[0]?.textContent.trim() || "",
            workspace: cells[1]?.textContent.trim() || "",
            nomeObjeto: cells[2]?.textContent.trim() || "",
            tipo: cells[3]?.textContent.trim() || "",
            link: cells[4]?.querySelector("a")?.href || "",
            consulta: row.dataset.consulta || "",
            retorno: row.dataset.retorno || "",
            tags: tagsArray, // Armazena as tags como array no JSON
            monitorar: cells[8]?.querySelector("input[type='checkbox']")?.checked || false
        };

        data.push(jsonData);
    });

    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "monitoring_data.json";
    link.click();
});




// Função para abrir o modal de consulta
function openModal(indicator, row) {
    currentConsultaIndicator = indicator;
    currentConsultaRow = row;

    const consulta = currentConsultaRow.dataset.consulta || "";
    codeEditor.setValue(consulta);

    modal.classList.remove("hidden");
    codeEditor.focus();
}

// Função para lidar com clique no retorno
function handleRetornoClick(indicator, row) {
    // Exemplo: Atualiza o indicador de retorno baseado em lógica personalizada
    const retornoAtual = row.dataset.retorno || "";
    if (retornoAtual) {
        row.dataset.retorno = ""; // Limpa retorno
        indicator.style.backgroundColor = "gray"; // Reseta cor
    } else {
        row.dataset.retorno = "Retorno exemplo"; // Define um retorno
        indicator.style.backgroundColor = "green"; // Define cor verde
    }
}


document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tags-input").forEach(input => {
        input.addEventListener("keypress", event => {
            if (event.key === "Enter") {
                const tagContainer = event.target.closest(".tags-container");
                const tagList = tagContainer.querySelector(".tags-list");
                const tagValue = event.target.value.trim();

                if (tagValue) {
                    // Cria a tag
                    const tagElement = document.createElement("div");
                    tagElement.classList.add("tag");
                    tagElement.innerHTML = `${tagValue} <span class="remove-tag">×</span>`;

                    // Adiciona evento para remover a tag
                    tagElement.querySelector(".remove-tag").addEventListener("click", () => {
                        tagList.removeChild(tagElement);
                    });

                    // Adiciona a tag à lista
                    tagList.appendChild(tagElement);

                    // Limpa o input
                    event.target.value = "";
                }
            }
        });
    });
});

// Seletores
const body = document.body;
const toggleSidebarBtn = document.getElementById("toggleSidebar");
const sidebar = document.querySelector(".sidebar");
const lightModeBtn = document.getElementById("lightMode");
const darkModeBtn = document.getElementById("darkMode");
const toggleThemeBtn = document.getElementById("toggleTheme");
const links = document.querySelectorAll('#navigation a');

toggleSidebarBtn.addEventListener('click', toggleSidebar);

// Alternar Tema
function setTheme(theme) {
    body.classList.remove("dark", "light");
    body.classList.add(theme);

    lightModeBtn.classList.toggle("active", theme === "light");
    darkModeBtn.classList.toggle("active", theme === "dark");

    // Atualizar ícone no botão fechado
    const icon = theme === "light" ? "ri-sun-line" : "ri-moon-line";
    toggleThemeBtn.innerHTML = `<i class="${icon}"></i>`;
}

// Alternar Sidebar
function toggleSidebar() {
    const isClosed = sidebar.classList.toggle("closed");

    lightModeBtn.style.display = isClosed ? "none" : "flex";
    darkModeBtn.style.display = isClosed ? "none" : "flex";
    toggleThemeBtn.style.display = isClosed ? "flex" : "none";
}

// Eventos
lightModeBtn.addEventListener("click", () => setTheme("light"));
darkModeBtn.addEventListener("click", () => setTheme("dark"));
toggleThemeBtn.addEventListener("click", () => {
    const currentTheme = body.classList.contains("dark") ? "light" : "dark";
    setTheme(currentTheme);
});

// Seleciona a sidebar, links e o contêiner global do tooltip

const tooltipContainer = document.getElementById('tooltip-container');

function showTooltip(event) {
    if (sidebar.classList.contains('closed')) {
        const tooltipText = event.currentTarget.getAttribute('data-tooltip');
        tooltipContainer.textContent = tooltipText;

        const tooltipX = event.pageX + 20;
        const tooltipY = event.pageY + 20;

        tooltipContainer.style.left = `${tooltipX}px`;
        tooltipContainer.style.top = `${tooltipY}px`;

        tooltipContainer.classList.add('show'); // Adiciona a classe .show
    }
}

function hideTooltip() {
    tooltipContainer.classList.remove('show'); // Remove a classe .show
}


// Adiciona eventos de mouse nos links da sidebar
links.forEach(link => {
    link.addEventListener('mouseenter', showTooltip);
    link.addEventListener('mousemove', showTooltip); // Atualiza a posição enquanto o mouse se move
    link.addEventListener('mouseleave', hideTooltip);
});


toggleThemeBtn.addEventListener('click', () => {
    // Verifica o tema atual e alterna para o oposto
    const currentTheme = body.classList.contains('dark') ? 'light' : 'dark';
    setTheme(currentTheme); // Chama a função que alterna o tema

    // Atualiza o ícone do botão fechado
    const icon = currentTheme === 'light' ? 'ri-sun-line' : 'ri-moon-line';
    toggleThemeBtn.innerHTML = `<i class="${icon}"></i>`;
});



function addLinkToTable(url) {
    if (!url) return; // Evita adicionar uma linha vazia

    const type = getTypeFromUrl(url); // Identifica o Tipo
    const tableBody = document.getElementById("monitorTable").querySelector("tbody");
    const row = document.createElement("tr");
    row.setAttribute("data-row-id", addressId); // Adiciona o atributo data-row-id à linha

    row.innerHTML = `
    <td>${addressId++}</td>
    <td></td> <!-- Workspace vazio -->
    <td></td> <!-- Nome do Objeto vazio -->
    <td>${type}</td>
    <td><a href="${url}" target="_blank">${url}</a></td>
    <td class="consulta-column">
        <span class="consulta-indicator" style="background-color: gray;"></span>
    </td>
    <td class="retorno-column">
        <span class="retorno-indicator" style="background-color: gray;"></span>
    </td>
    <td class="tags-column">
        <button class="tag-button" data-row-id="${addressId - 1}">
            <i class="ri-price-tag-3-line"></i>
        </button>
        <div class="hidden-tags" style="display: none;"></div> <!-- Elemento oculto para armazenar as tags -->
    </td>
    <td>
        <label class="toggle-switch">
            <input type="checkbox" class="monitor-toggle" />
            <span class="slider"></span>
        </label>
    </td>
    `;



    row.dataset.consulta = ""; // Inicializa com consulta vazia
    row.dataset.retorno = ""; // Inicializa com retorno vazio
    row.dataset.tags = ""; // Inicializa com tags vazias
    tableBody.appendChild(row);

    // Adicionar evento de contexto no link após a criação da linha
    const link = row.querySelector("a");
    link.addEventListener("contextmenu", event => {
        event.preventDefault(); // Impede o menu de contexto padrão do navegador
        currentLink = link; // Armazena o link atual
        console.log("Link capturado:", currentLink.href); // Log para depuração
        showContextMenu(event.pageX, event.pageY);
    });

    // Adicionar evento para o indicador de consulta
    const consultaIndicator = row.querySelector(".consulta-indicator");
    consultaIndicator.addEventListener("click", () => {
        openModal(consultaIndicator, row);
    });

    // Adicionar evento para o indicador de retorno
    const retornoIndicator = row.querySelector(".retorno-indicator");
    retornoIndicator.addEventListener("click", () => {
        handleRetornoClick(retornoIndicator, row);
    });

    // Evento para o campo de tags
    const tagsInput = row.querySelector(".tags-input");
    tagsInput.addEventListener("keypress", event => {
        if (event.key === "Enter") {
            const tagContainer = row.querySelector(".tags-list");
            const tagValue = tagsInput.value.trim();

            if (tagValue) {
                const tagElement = document.createElement("div");
                tagElement.classList.add("tag");
                tagElement.innerHTML = `${tagValue} <span class="remove-tag">×</span>`;

                // Adiciona evento para remover a tag
                tagElement.querySelector(".remove-tag").addEventListener("click", () => {
                    tagContainer.removeChild(tagElement);
                });

                tagContainer.appendChild(tagElement);
                tagsInput.value = ""; // Limpa o input
            }
        }
    });
}



// Seletores
const contextMenu = document.getElementById("contextMenu");
const goToArtifactOption = document.getElementById("goToArtifact");
let currentLink = null; // Armazena o link atual para abrir


// Exibir o menu de contexto ao clicar com o botão direito em um link
document.querySelector(".table-container").addEventListener("contextmenu", event => {
    const link = event.target.closest("a"); // Verifica se o alvo é um link
    if (link) {
        event.preventDefault();
        console.log("Evento contextmenu capturado no link:", link.href);
    }
});


// Ação ao clicar na opção "Ir para o artefato"
goToArtifactOption.addEventListener("click", () => {
    if (currentLink) {
        window.open(currentLink.href, "_blank"); // Abre o link em uma nova aba
    }
    contextMenu.style.display = "none"; // Fecha o menu de contexto
});


document.addEventListener("contextmenu", event => {
    event.preventDefault();
    console.log("Evento contextmenu capturado!");
});

// Seleciona as tabelas que contêm os links
const tables = document.querySelectorAll(".table-container");

// Adiciona o evento de contexto apenas nos links das tabelas
tables.forEach(table => {
    table.addEventListener("contextmenu", event => {
        const link = event.target.closest("a"); // Verifica se o alvo é um link
        if (link) {
            event.preventDefault(); // Impede o menu de contexto padrão do navegador
            currentLink = link; // Armazena o link atual
            showContextMenu(event.pageX, event.pageY); // Exibe o menu na posição do clique
        }
    });
});

// Função para exibir o menu de contexto na posição do mouse
function showContextMenu(x, y) {
    const menuWidth = contextMenu.offsetWidth;
    const menuHeight = contextMenu.offsetHeight;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Ajusta a posição horizontal se o menu ultrapassar a largura da tela
    if (x + menuWidth > viewportWidth) {
        x = viewportWidth - menuWidth - 10; // Ajusta com margem de 5px
    }

    // Ajusta a posição vertical se o menu ultrapassar a altura da tela
    if (y + menuHeight > viewportHeight) {
        y = viewportHeight - menuHeight - 10; // Ajusta com margem de 5px
    }

    contextMenu.style.left = `${x}px`;
    contextMenu.style.top = `${y}px`;
    contextMenu.style.display = "block";
    console.log("Exibindo menu de contexto ajustado na posição:", x, y);
}

// Fechar o menu de contexto ao clicar fora dele
document.addEventListener("click", event => {
    if (!contextMenu.contains(event.target)) {
        contextMenu.style.display = "none";
    }
});


let currentRowForTags = null; // Variável para armazenar a linha atual para as tags
let currentTags = []; // Armazena as tags temporariamente

// Seleciona os elementos do modal
const tagModal = document.getElementById("tagModal");
const tagsListModal = document.getElementById("tagsListModal");
const tagsInputModal = document.getElementById("tagsInputModal");
const saveTagsButton = document.getElementById("saveTagsButton");
const closeTagModal = document.getElementById("closeTagModal");

// Função para abrir o modal de tags
function openTagModal(row) {
    currentRowForTags = row; // Armazena a linha atual
    currentTags = row.dataset.tags ? row.dataset.tags.split(",") : []; // Recupera as tags existentes
    renderTags(); // Renderiza as tags no modal
    tagModal.classList.add("show"); // Exibe o modal
}

// Adicionar evento ao botão de tags em cada linha
document.addEventListener("click", event => {
    if (event.target.closest(".tag-button")) {
        const button = event.target.closest(".tag-button");
        const rowId = button.dataset.rowId;
        const row = document.querySelector(`[data-row-id="${rowId}"]`);
        openTagModal(row);
    }
});

// Fechar o modal ao clicar no botão de fechar
closeTagModal.addEventListener("click", () => {
    tagModal.classList.remove("show");
});

// Salvar as tags ao clicar no botão "Salvar"
saveTagsButton.addEventListener("click", () => {
    const tags = tagsInputModal.value.trim();
    if (currentRowForTags) {
        currentRowForTags.dataset.tags = tags; // Salva as tags no dataset da linha

        // Atualiza o elemento oculto com as tags
        const hiddenTagsContainer = currentRowForTags.querySelector(".hidden-tags");
        hiddenTagsContainer.textContent = tags; // Armazena as tags no elemento oculto

        console.log(`Tags salvas para a linha ${currentRowForTags.dataset.rowId}: ${tags}`);
    }
    tagModal.classList.remove("show"); // Fecha o modal
});


// Função para renderizar as tags no modal
function renderTags() {
    tagsListModal.innerHTML = ""; // Limpa a lista de tags
    currentTags.forEach(tag => {
        const tagElement = document.createElement("div");
        tagElement.classList.add("tag");
        tagElement.innerHTML = `${tag} <button class="remove-tag">×</button>`;

        // Evento para remover a tag ao clicar no botão de remover
        tagElement.querySelector(".remove-tag").addEventListener("click", () => {
            currentTags = currentTags.filter(t => t !== tag); // Remove a tag da lista
            renderTags(); // Re-renderiza a lista de tags
        });

        tagsListModal.appendChild(tagElement);
    });
}

// Evento para adicionar uma nova tag ao pressionar Enter
tagsInputModal.addEventListener("keypress", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        const newTag = tagsInputModal.value.trim();
        if (newTag && !currentTags.includes(newTag)) {
            currentTags.push(newTag); // Adiciona a nova tag à lista
            renderTags(); // Re-renderiza a lista de tags
        }
        tagsInputModal.value = ""; // Limpa o campo de input
    }
});

// Fechar o modal ao clicar no botão de fechar
closeTagModal.addEventListener("click", () => {
    tagModal.classList.remove("show");
});

// Salvar as tags ao clicar no botão "Salvar"
saveTagsButton.addEventListener("click", () => {
    if (currentRowForTags) {
        currentRowForTags.dataset.tags = currentTags.join(","); // Salva as tags no dataset da linha

        // Atualiza o elemento oculto com as tags
        const hiddenTagsContainer = currentRowForTags.querySelector(".hidden-tags");
        hiddenTagsContainer.textContent = currentTags.join(",");

        console.log(`Tags salvas para a linha ${currentRowForTags.dataset.rowId}: ${currentTags.join(",")}`);
    }
    tagModal.classList.remove("show"); // Fecha o modal
});

