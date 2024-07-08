sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function(Controller, MessageToast, JSONModel) {
    "use strict";
    var sUrl = 'https://api-btp.azurewebsites.net/api';

    return Controller.extend("logincep.controller.BuscaCep", {
       
        onInit: function() {
            // Inicialização do controlador
        },
       
        _loadHistorico: function() {
            var uId = localStorage.getItem('localId');

            $.ajax({
                url: sUrl + '/buscaCep/getAllByUserId?userId=' + uId,
                method: "GET",
                contentType: "application/json",
                success: (data) => {
                    this.createHistoricTable(data);
                },
                error: () => {
                    MessageToast.show("Erro ao buscar histórico.");
                }
            })
        },

        createHistoricTable: function(data){
            var aHistorico = [];
            var oView = this.getView();

            data.forEach((doc) => {
                aHistorico.push(doc);
            });

            var oModel = new JSONModel({ historico: aHistorico });
            oView.setModel(oModel, "historico");

            var oTable = oView.byId("historicoTable");
            var oTemplate = new sap.m.ColumnListItem({
                cells: [
                    new sap.m.Text({ text: "{historico>data}" }),
                    new sap.m.Text({ text: "{historico>cep}" }),
                    new sap.m.Text({ text: "{historico>resultado}" })
                ]
            });

            oTable.bindItems({
                path: "historico>/historico",
                template: oTemplate
            });
            oTable.attachItemPress(function(oEvent) {
                var oSelectedItem = oEvent.getParameter("listItem");
                var oContext = oSelectedItem.getBindingContext("historico");
                var oItemData = oContext.getObject();
                console.log(oItemData);
                this.mostrarDetalhesHistorico(oItemData, oSelectedItem);
            }.bind(this));
        },
 
        mostrarDetalhesHistorico: function(oItemData, oSelectedItem) {
            var oPopover = new sap.m.Popover({
                title: "Detalhes do Histórico",
                contentWidth: "300px",
                content: [
                    new sap.m.Label({ text: "Data: " + oItemData.data }),
                    new sap.m.Label({ text: "CEP: " + oItemData.cep }),
                    new sap.m.Label({ text: "Resultado: " + oItemData.resultado })
                ]
            });
 
            oPopover.openBy(oSelectedItem);
        },
 
        onBuscarCep: function() {
            var oView = this.getView();
            var sCep = oView.byId("inputCep").getValue();
 
            if (sCep === "") {
                MessageToast.show("Por favor, insira um CEP.");
                return;
            }
 
            sCep = sCep.replace(/\D/g, '');
 
            if (sCep.length !== 8) {
                MessageToast.show("Por favor, insira um CEP válido com 8 dígitos.");
                return;
            }
 
            var sUrl = "https://viacep.com.br/ws/" + sCep + "/json/";
 
            $.ajax({
                url: sUrl,
                method: "GET",
                success: function(data) {
                    if (data.erro) {
                        MessageToast.show("CEP não encontrado.");
                        oView.byId("textResult").setText("");
                    } else {
                        var oModel = new JSONModel(data);
                        oView.setModel(oModel, "cep");
 
                        this.exibirResultadoNaTabela(data);
                        this.salvarNoFirestore(data);
                    }
                }.bind(this),
                error: function() {
                    MessageToast.show("Erro ao buscar o CEP.");
                    oView.byId("textResult").setText("");
                }
            });
        },
 
        exibirResultadoNaTabela: function(data) {
            var aData = [
                { campo: "Logradouro:", valor: data.logradouro },
                { campo: "Bairro:", valor: data.bairro },
                { campo: "Cidade:", valor: data.localidade },
                { campo: "Estado:", valor: data.uf }
            ];
        
            var tableHtml = '<table class="resultTable">';
            tableHtml += '<thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>';
        
            aData.forEach(function(item) {
                tableHtml += '<tr><td>' + item.campo + '</td><td>' + item.valor + '</td></tr>';
            });
        
            tableHtml += '</tbody></table>';
        
            var textResultDiv = document.getElementById("container-sap.btp.logincep---BuscaCep--textResult");
            textResultDiv.innerHTML = tableHtml;
        },
 
        salvarNoFirestore: function(data) {
            var uId = localStorage.getItem('localId'); 
            var dataHoraLocal = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
 
            $.ajax({
                url: sUrl + '/buscaCep',
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    data: dataHoraLocal,
                    cep: data.cep,
                    resultado: data.logradouro + ", " + data.bairro + ", " + data.localidade + ", " + data.uf,
                    userId: uId
                }),
                success: () => {
                    MessageToast.show("Busca salva com sucesso!");
                   
                },
                error: () => {
                    MessageToast.show("Erro ao tentar fazer registro.");
                }
            });

        },

        
 
        onBack: function() {
            this.getOwnerComponent().getRouter().navTo("LoginCep");
        },
 
        onUserPress: function() {
            MessageToast.show("Botão do usuário pressionado");
        },
 
        onMenuSelect: function(oEvent) {
            var sItemId = oEvent.getSource().getId();
            var oPage = this.byId("pageBuscaCep");
 
            if (sItemId === "container-logincep---BuscaCep--menuItemBuscaCep") {
                oPage.setTitle("Busca CEP");
                this.byId("vboxBuscaCep").setVisible(true);
                this.byId("vboxHistorico").setVisible(false);
            } else if (sItemId === "container-logincep---BuscaCep--menuItemHistorico"){
                oPage.setTitle("Histórico");
                this.byId("vboxBuscaCep").setVisible(false);
                this.byId("vboxHistorico").setVisible(true);
                this._loadHistorico();
            }
 
            var oSplitApp = this.byId("SplitApp");
            oSplitApp.toDetail(this.createId("pageBuscaCep"));
        },
 
        onLogout: function () {
            // Task: Usar o endpoit que faz o logout
            firebase.auth().signOut().then(() => {
                localStorage.clear();
                MessageToast.show("Logout successful!");
                var oPage = this.byId("pageBuscaCep");
                oPage.setTitle("Busca CEP");
                this.byId("vboxBuscaCep").setVisible(true);
                this.byId("vboxHistorico").setVisible(false);
                document.getElementById("container-sap.btp.logincep---BuscaCep--textResult").innerHTML = '';
                this.byId("inputCep").setValue("");
                this.getOwnerComponent().getRouter().navTo("RouteLoginCep");
            }).catch((error) => {
                MessageToast.show(error.message);
            });
        },
 
        onBuscarEndereco: function() {
            var oView = this.getView();
            var sCep = oView.byId("inputEndereco").getValue();
       
            var sCepNormalizado = sCep.replace(/\D/g, '').replace(/^(\d{5})(\d)/, "$1-$2");

            if (sCepNormalizado.length !== 9) {
                MessageToast.show("Por favor, insira um CEP válido com 8 dígitos.");
                
            }else{
                 $.ajax({
                url: sUrl + '/buscaCep/getAllByCep?cep=' + sCepNormalizado,
                method: "GET",
                contentType: "application/json",
                success: (data) => {
                    var oHistoricoModel = oView.getModel("historico");
                    oHistoricoModel.setProperty("/historico", data);
                },
                error: () => {
                    MessageToast.show("Não há nenhum registro com este CEP.");
                }
            });
            }      
            
        },
 
        onOrdenarCrescente: function() {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
       
            aHistorico.sort(function(a, b) {
                var dataA = new Date(a.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                var dataB = new Date(b.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
       
                return dataA - dataB;
            });
       
            oHistoricoModel.setProperty("/historico", aHistorico);
        },
 
        onOrdenarDecrescente: function() {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
       
            aHistorico.sort(function(a, b) {
                var dataA = new Date(a.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                var dataB = new Date(b.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
       
                return dataB - dataA;
            });
       
            oHistoricoModel.setProperty("/historico", aHistorico);
        },
 
        onLimpaOrdenacao: function() {
            this._loadHistorico();
        },
 
        onGerarRelatorio: function() {
            var oView = this.getView();
            var oHistoricoTable = oView.byId("historicoTable");
 
            if (!oHistoricoTable) {
                MessageToast.show("Erro ao acessar a tabela de histórico.");
                return;
            }
 
            var bTableVisible = oHistoricoTable.getVisible();
            oHistoricoTable.setVisible(true);
 
            var oDate = new Date();
            var sDateTime = oDate.toLocaleDateString() + ' ' + oDate.toLocaleTimeString();
 
            var sTableContent = `
                <header>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/59/SAP_2011_logo.svg" alt="SAP Logo">
                    <h2>Histórico de Buscas</h2>
                    <div class="datetime">Emitido em: ${sDateTime}</div>
                </header>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>`;
 
            oHistoricoTable.getColumns().forEach(function(oColumn) {
                sTableContent += "<th>" + oColumn.getHeader().getText() + "</th>";
            });
            sTableContent += `
                            </tr>
                        </thead>
                        <tbody>`;
 
            oHistoricoTable.getItems().forEach(function(oItem) {
                sTableContent += "<tr>";
                oItem.getCells().forEach(function(oCell) {
                    sTableContent += "<td>" + oCell.getText() + "</td>";
                });
                sTableContent += "</tr>";
            });
            sTableContent += `
                        </tbody>
                    </table>
                </div>`;
 
            var oPopupWin = window.open('', '_blank', 'width=800,height=750');
            oPopupWin.document.open();
            oPopupWin.document.write(`
                <html>
                    <head>
                        <title>Relatório de Histórico de Buscas</title>
                        <link rel="stylesheet" type="text/css" href="css/relatorio.css">
                    </head>
                    <body>
                        ${sTableContent}
                    </body>
                </html>`);
            oPopupWin.document.close();
 
            setTimeout(function() {
                oHistoricoTable.setVisible(bTableVisible);
            }, 1000);
        }
    });
});
