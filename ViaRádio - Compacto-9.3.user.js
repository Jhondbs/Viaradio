// ==UserScript==
// @name         ViaRádio - Compacto
// @namespace    http://tampermonkey.net/
// @version      9.3
// @description  Layout linha única, barra de busca padronizada e Legenda alinhada ao Título.
// @author       Jhon
// @match        *://viaradio.jupiter.com.br/painel.php?adm=atendimentopresencial*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    console.log(">>> ViaRádio Script V9.3 (Legend Header) Iniciado");

    // --- 1. CSS (ESTILOS) ---
    const compactCSS = `
        /* =======================================
           ESTILOS GERAIS
           ======================================= */
        .page-header-container { align-items: center; padding: 6px 10px !important; }
        .page-header-actions { padding-top: 2px !important; padding-bottom: 2px !important; gap: 4px; }

        .page-header-actions .action-btn {
            padding: 0px 0px !important; height: 30px; min-width: 50px; font-size: 12px !important;
            display: flex; align-items: center; justify-content: center; border-radius: 6px;
        }
        .page-header-actions .action-btn span { display: none !important; }
        .page-header-actions .action-btn[title] { content: none !important; }

        /* Tooltip */
        #custom-tooltip {
            position: fixed; background-color: #333; color: #fff; padding: 5px 10px;
            border-radius: 4px; font-size: 12px; font-weight: 500; z-index: 100000;
            opacity: 0; visibility: hidden; pointer-events: none; transition: opacity 0.2s;
            white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        /* =======================================
           NOVO: ESTILO DO CABEÇALHO COM LEGENDA (V9.3)
           ======================================= */

        /* Wrapper que segura o Título e a Legenda */
        .header-legend-wrapper {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            gap: 20px;
            margin-bottom: 10px;
            width: 100%;
        }

        /* Título "Filtros e Pesquisa" */
        .filters-section h3 {
            margin: 0 !important;
            padding: 0 !important;
            white-space: nowrap; /* Não quebra linha */
            font-size: 16px !important;
            color: #333;
        }

        /* Ajuste da Legenda Original */
        .legend-grid {
            display: flex !important;
            flex-wrap: wrap !important;
            gap: 10px !important;
            padding: 0 !important;
            margin: 0 !important;
            background: transparent !important; /* Remove o fundo cinza */
            border: none !important;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 5px !important;
            font-size: 11px !important; /* Fonte levemente menor para caber bem */
            color: #555;
        }

        .legend-color {
            width: 12px !important;
            height: 12px !important;
            border-radius: 3px !important;
        }

        /* =======================================
           PADRONIZAÇÃO DE INPUTS E SELECTS
           ======================================= */
        .filters-section select,
        .converted-select,
        .standard-input {
            padding: 0px 0px; border-radius: 6px !important; border: 1px solid #ccc !important;
            font-size: 13px !important; height: 25px !important; line-height: normal !important;
            box-sizing: border-box !important; background-color: #fff !important;
            vertical-align: middle !important; color: #333 !important;
        }
        input[type="date"].standard-input { padding: 2px 8px !important; }
        input[type="submit"].standard-input {
            background-color: #f0f0f0 !important; font-weight: 600 !important;
            cursor: pointer !important; padding: 0 15px !important;
        }
        input[type="submit"].standard-input:hover {
            background-color: #e0e0e0 !important; border-color: #bbb !important;
        }

        .filters-section, #content > div:nth-child(2) { padding: 10px !important; margin-bottom: 10px !important; }
        .element-hidden { display: none !important; }

        /* =======================================
           LAYOUT LINHA ÚNICA (FILTROS)
           ======================================= */
        .single-line-container {
            display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important;
            gap: 10px !important; align-items: stretch !important; width: 100% !important;
            grid-template-columns: none !important;
        }
        .single-line-container fieldset {
            flex: 1 1 0px !important; width: auto !important; min-width: 0 !important;
            margin: 0 !important; padding: 4px 8px !important; box-sizing: border-box;
            display: flex; flex-direction: column; justify-content: center;
        }
        .single-line-container fieldset legend {
            font-size: 11px !important; white-space: nowrap; margin-bottom: 2px !important; width: auto;
        }
        .single-line-container select,
        .single-line-container .converted-select,
        .single-line-container .custom-multiselect-btn {
            width: 100% !important; max-width: 100% !important; margin-right: 0 !important; display: flex !important;
        }

        /* =======================================
           ESTILO DO DROPDOWN DE CHECKBOXES
           ======================================= */
        .multiselect-wrapper { position: relative; width: 100%; box-sizing: border-box; display: block; }
        .custom-multiselect-btn {
            padding: 0 10px; border-radius: 6px; border: 1px solid #ccc;
            font-size: 13px; height: 30px; line-height: 28px; width: 100%;
            background-color: #fff; cursor: pointer; display: flex; align-items: center;
            justify-content: space-between; color: #333; user-select: none; box-sizing: border-box;
        }
        .custom-multiselect-btn:after { content: '▼'; font-size: 9px; color: #555; margin-left: 8px; margin-right: 2px; flex-shrink: 0; }
        .custom-multiselect-content {
            display: none; position: absolute; top: 100%; left: 0;
            background-color: #fff; width: 100%; min-width: 200px;
            box-shadow: 0px 4px 12px rgba(0,0,0,0.15); z-index: 99999;
            border: 1px solid #ddd; border-radius: 4px; max-height: 300px;
            overflow-y: auto; margin-top: 2px; box-sizing: border-box;
        }
        .single-line-container fieldset:last-child .custom-multiselect-content { right: 0; left: auto; }
        .custom-multiselect-content.show { display: block; }
        .custom-multiselect-item {
            padding: 8px 10px; cursor: pointer; display: flex; align-items: center;
            border-bottom: 1px solid #f5f5f5; font-size: 13px; color: #444;
        }
        .custom-multiselect-item:last-child { border-bottom: none; }
        .custom-multiselect-item:hover { background-color: #f0f7ff; }
        .custom-chk-icon {
            width: 14px; height: 14px; border: 1px solid #bbb; border-radius: 3px;
            margin-right: 10px; display: flex; align-items: center; justify-content: center;
            font-size: 10px; color: transparent; background: #fff; flex-shrink: 0;
        }
        .custom-multiselect-item.selected { background-color: #e6f3ff; font-weight: 500; }
        .custom-multiselect-item.selected .custom-chk-icon {
            background-color: #2196F3; border-color: #2196F3; color: #fff;
        }
    `;

    function injectCSS(css) {
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // --- 2. FUNÇÃO PARA REPOSICIONAR A LEGENDA (NOVO NA V9.3) ---
    function repositionLegend() {
        // Tenta encontrar o Título e a Legenda
        const header = document.querySelector('.filters-section h3');
        const legend = document.querySelector('.legend-grid');

        if (header && legend) {
            // Cria um wrapper Flexbox
            const wrapper = document.createElement('div');
            wrapper.className = 'header-legend-wrapper';

            // Insere o wrapper antes do header atual
            header.parentNode.insertBefore(wrapper, header);

            // Move os elementos para dentro do wrapper
            wrapper.appendChild(header);
            wrapper.appendChild(legend);

            console.log(">>> Legenda movida para o topo com sucesso.");
        }
    }

    // --- 3. PADRONIZAÇÃO DA BARRA DE BUSCA ---
    function styleSearchBar() {
        const form = document.querySelector('form[action="painel.php"]');
        if (!form) return;

        const elementsToStyle = form.querySelectorAll('select, input[type="text"], input[type="date"], input[type="submit"]');

        elementsToStyle.forEach(el => {
            el.classList.add('standard-input');
            el.style.height = ''; el.style.padding = '';
        });

        const labels = form.querySelectorAll('b');
        labels.forEach(b => {
            if(b.innerText.includes('Buscar')) {
                b.style.verticalAlign = 'middle';
                b.style.marginRight = '5px';
                b.style.fontSize = '13px';
            }
        });
    }

    // --- 4. CONVERSÃO DE RÁDIO PARA SELECT ---
    function convertRadioGroupsToSelect() {
        const fieldsets = document.querySelectorAll('fieldset');
        fieldsets.forEach(fieldset => {
            if (fieldset.textContent.includes("Filtros Adicionais")) return;
            const radioButtons = fieldset.querySelectorAll('input[type="radio"]');
            if (radioButtons.length === 0) return;
            const containerDiv = radioButtons[0].closest('div');
            if (!containerDiv || containerDiv.classList.contains('element-hidden')) return;
            if (fieldset.querySelector('select.converted-select')) {
                containerDiv.classList.add('element-hidden');
                return;
            }
            const name = radioButtons[0].name;
            const newSelect = document.createElement('select');
            newSelect.className = 'converted-select';
            newSelect.name = name;
            let selectedValue = null;
            radioButtons.forEach(radio => {
                const label = radio.closest('label');
                const text = label ? label.textContent.trim() : radio.value;
                const option = document.createElement('option');
                option.value = radio.value;
                option.textContent = text;
                if (radio.checked) selectedValue = radio.value;
                newSelect.appendChild(option);
            });
            if (selectedValue !== null) newSelect.value = selectedValue;
            newSelect.addEventListener('change', function() {
                const targetRadio = document.querySelector(`input[name="${name}"][value="${this.value}"]`);
                if (targetRadio) targetRadio.click();
            });
            containerDiv.classList.add('element-hidden');
            fieldset.appendChild(newSelect);
        });
    }

    // --- 5. CONVERSÃO DE CHECKBOX PARA DROPDOWN ---
    function createCustomCheckboxDropdown() {
        const allFieldsets = Array.from(document.querySelectorAll('fieldset'));
        const targetFieldset = allFieldsets.find(fs => fs.innerText && fs.innerText.includes("Filtros Adicionais"));
        if (!targetFieldset) return;
        const checkboxes = targetFieldset.querySelectorAll('input[type="checkbox"]');
        if (checkboxes.length === 0) return;
        const originalContainer = checkboxes[0].closest('div');
        if (!originalContainer) return;
        if (targetFieldset.querySelector('.multiselect-wrapper')) return;

        originalContainer.classList.add('element-hidden');
        const wrapper = document.createElement('div');
        wrapper.className = 'multiselect-wrapper';
        const btn = document.createElement('div');
        btn.className = 'custom-multiselect-btn';
        btn.textContent = 'Carregando...';
        const list = document.createElement('div');
        list.className = 'custom-multiselect-content';

        function updateLabel() {
            const checkedList = Array.from(checkboxes).filter(c => c.checked);
            const count = checkedList.length;
            if (count === 0) {
                btn.textContent = 'Nenhum filtro'; btn.style.color = '#888';
            } else if (count === 1) {
                const label = checkedList[0].closest('label');
                let text = label ? label.textContent.trim() : '1 Selecionado';
                if(text.length > 20) text = text.substring(0,18) + '...';
                btn.textContent = text; btn.style.color = '#333';
            } else {
                btn.textContent = `${count} selecionados`; btn.style.color = '#333';
                const names = checkedList.map(c => c.closest('label').textContent.trim()).join(', ');
                btn.title = names;
            }
        }

        checkboxes.forEach(chk => {
            const labelOriginal = chk.closest('label');
            const labelText = labelOriginal ? labelOriginal.textContent.trim() : chk.value;
            const item = document.createElement('div');
            item.className = 'custom-multiselect-item';
            if (chk.checked) item.classList.add('selected');
            const icon = document.createElement('div');
            icon.className = 'custom-chk-icon';
            icon.textContent = '✔';
            const text = document.createElement('span');
            text.textContent = labelText;
            item.appendChild(icon);
            item.appendChild(text);
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                chk.click();
                if (chk.checked) item.classList.add('selected');
                else item.classList.remove('selected');
                updateLabel();
            });
            list.appendChild(item);
        });
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelectorAll('.custom-multiselect-content.show').forEach(el => {
                if(el !== list) el.classList.remove('show');
            });
            list.classList.toggle('show');
        });
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                list.classList.remove('show');
            }
        });
        updateLabel();
        wrapper.appendChild(btn);
        wrapper.appendChild(list);
        originalContainer.parentNode.insertBefore(wrapper, originalContainer.nextSibling);
    }

    // --- 6. FORÇAR LAYOUT LINHA ÚNICA ---
    function forceSingleLineLayout() {
        const fieldsets = document.querySelectorAll('fieldset');
        let container = null;
        let additionalFiltersFieldset = null;
        fieldsets.forEach(fs => {
            if (fs.innerText && fs.innerText.includes("Filtros Adicionais")) {
                additionalFiltersFieldset = fs;
            } else if (!container) {
                container = fs.parentNode;
            }
        });
        if (container && additionalFiltersFieldset) {
            if (additionalFiltersFieldset.parentNode !== container) {
                container.appendChild(additionalFiltersFieldset);
            }
            container.classList.add('single-line-container');
            container.style.display = ''; container.style.gridTemplateColumns = '';
        }
    }

    // --- 7. TOOLTIPS ---
    function enableStyledTooltips() {
        const actionButtons = document.querySelectorAll('.page-header-actions .action-btn');
        let tooltip = document.getElementById('custom-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'custom-tooltip';
            document.body.appendChild(tooltip);
        }
        actionButtons.forEach(button => {
            const span = button.querySelector('span');
            const text = span ? span.textContent.trim() : null;
            if (!text) return;
            button.addEventListener('mouseenter', () => {
                tooltip.textContent = text;
                tooltip.style.opacity = '1'; tooltip.style.visibility = 'visible';
                const rect = button.getBoundingClientRect();
                tooltip.style.top = (rect.top - tooltip.offsetHeight - 5) + 'px';
                tooltip.style.left = (rect.left + (rect.width/2) - (tooltip.offsetWidth/2)) + 'px';
            });
            button.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0'; tooltip.style.visibility = 'hidden';
            });
        });
    }

    // --- EXECUÇÃO ---
    setTimeout(() => {
        injectCSS(compactCSS);
        repositionLegend(); // Reposiciona a legenda ao lado do título
        convertRadioGroupsToSelect();
        createCustomCheckboxDropdown();
        forceSingleLineLayout();
        styleSearchBar();
        enableStyledTooltips();
    }, 50);

})();