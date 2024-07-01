sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel"
], function(Controller, MessageToast, JSONModel) {
    "use strict";

    return Controller.extend("sap.btp.logincep.controller.BuscaCep", {
        
        onInit: function() {
            // Inicialização do controlador
        },

        _loadHistorico: function() {
            var oView = this.getView();
            var db = firebase.firestore();
            var user = firebase.auth().currentUser;

            db.collection("buscaCep")
                .where("userId", "==", user.uid)
                .get()
                .then((querySnapshot) => {
                    var aHistorico = [];
                    querySnapshot.forEach((doc) => {
                        aHistorico.push(doc.data());
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
                        this.mostrarDetalhesHistorico(oItemData);
                    }.bind(this));
                })
                .catch((error) => {
                    console.error("Erro ao carregar histórico:", error);
                    MessageToast.show("Erro ao carregar histórico.");
                });
        },

        mostrarDetalhesHistorico: function(oItemData) {
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
                { campo: "Logradouro", valor: data.logradouro },
                { campo: "Bairro", valor: data.bairro },
                { campo: "Cidade", valor: data.localidade },
                { campo: "Estado", valor: data.uf }
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
            var oView = this.getView();
            var user = firebase.auth().currentUser;
            var db = firebase.firestore();

            var dataHoraLocal = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

            db.collection("buscaCep").add({
                data: dataHoraLocal,
                cep: data.cep,
                resultado: data.logradouro + ", " + data.bairro + ", " + data.localidade + ", " + data.uf,
                userId: user.uid
            }).then(function(docRef) {
                console.log("Busca salva com sucesso no Firestore!");
                MessageToast.show("Busca salva com sucesso!");

                var oHistoricoModel = oView.getModel("historico");
                var aHistorico = (oHistoricoModel && oHistoricoModel.getProperty("/historico")) || [];
                aHistorico.unshift({
                    data: dataHoraLocal,
                    cep: data.cep,
                    resultado: data.logradouro + ", " + data.bairro + ", " + data.localidade + ", " + data.uf,
                });

                if (oHistoricoModel) {
                    oHistoricoModel.setProperty("/historico", aHistorico);
                } else {
                    oHistoricoModel = new JSONModel({ historico: aHistorico });
                    oView.setModel(oHistoricoModel, "historico");
                }
            }).catch(function(error) {
                console.error("Erro ao salvar a busca no Firestore: ", error);
                MessageToast.show("Erro ao salvar a busca no Firestore.");
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
            console.log(sItemId)
            var oPage = this.byId("pageBuscaCep");

            if (sItemId === "container-sap.btp.logincep---BuscaCep--menuItemBuscaCep") {
                oPage.setTitle("Busca CEP");
                this.byId("vboxBuscaCep").setVisible(true);
                this.byId("vboxHistorico").setVisible(false);
            } else if (sItemId === "container-sap.btp.logincep---BuscaCep--menuItemHistorico"){
                oPage.setTitle("Histórico");
                this.byId("vboxBuscaCep").setVisible(false);
                this.byId("vboxHistorico").setVisible(true);
                this._loadHistorico();
            }

            var oSplitApp = this.byId("SplitApp");
            oSplitApp.toDetail(this.createId("pageBuscaCep"));
        },

        onLogout: function () {
            firebase.auth().signOut().then(() => {
                MessageToast.show("Logout successful!");
                var oPage = this.byId("pageBuscaCep");
                oPage.setTitle("Busca CEP");
                this.byId("vboxBuscaCep").setVisible(true);
                this.byId("vboxHistorico").setVisible(false);
                this.getOwnerComponent().getRouter().navTo("RouteLoginCep");
            }).catch((error) => {
                MessageToast.show(error.message);
            });
        },

        onBuscarEndereco: function() {
            var oView = this.getView();
            var sCep = oView.byId("inputEndereco").getValue();
        
            var sCepNormalizado = sCep.replace(/\D/g, '');
        
            if (sCepNormalizado.length !== 8) {
                MessageToast.show("Por favor, insira um CEP válido com 8 dígitos.");
                this._loadHistorico();
                return;
            }
        
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
        
            var aFilteredHistorico = aHistorico.filter(function(item) {
                var sItemCepNormalizado = item.cep.replace(/\D/g, '');
                return sItemCepNormalizado === sCepNormalizado;
            });
        
            if (aFilteredHistorico.length === 0) {
                this._loadHistorico();
                return;
            }
        
            oHistoricoModel.setProperty("/historico", aFilteredHistorico);
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
