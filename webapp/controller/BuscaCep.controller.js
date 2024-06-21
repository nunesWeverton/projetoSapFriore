sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Table",
    "sap/m/Column",
    "sap/m/Label",
    "sap/m/ColumnListItem",
    "sap/m/Text",
    "sap/ui/core/util/File",
    "sap/ui/core/Fragment"
], function (Controller, MessageToast, JSONModel, Table, Column, Label, ColumnListItem, Text, FileUtil, Fragment) {
    "use strict";

    return Controller.extend("logincep.controller.BuscaCep", {

        onInit: function () {
            // Limpar o histórico ao inicializar
            firebase.auth().onAuthStateChanged(function(user) {
                if (user) {
                    // Usuário logado
                    this._loadHistorico();
                } else {
                    // Nenhum usuário logado, limpar histórico
                    this._clearHistorico();
                    this.getView().byId("inputCep").setValue("");
                    this._clearCepTable();
                }
            }.bind(this));
        },


        _clearCepTable: function () {
            var oView = this.getView();
            var oTable = oView.byId("textResult");
            if (oTable) {
                oTable.removeAllItems();
            }
        },

        _clearHistorico: function () {
            var oView = this.getView();
            var oModel = new JSONModel({ historico: [] });
            oView.setModel(oModel, "historico");

            var oTable = oView.byId("historicoTable");
            oTable.destroyItems();
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
                    var oTemplate = new ColumnListItem({
                        cells: [
                            new Text({ text: "{historico>data}" }),
                            new Text({ text: "{historico>cep}" }),
                            new Text({ text: "{historico>resultado}" })
                        ]
                    });
       
                    oTable.bindItems({
                        path: "historico>/historico",
                        template: oTemplate
                    });
                })
                .catch((error) => {
                    console.error("Erro ao carregar histórico:", error);
                    MessageToast.show("Erro ao carregar histórico.");
                });
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
                        // Atualizar o modelo com os dados do CEP
                        var oModel = new JSONModel(data);
                        oView.setModel(oModel, "cep");
       
                        // Exibir resultados na tabela
                        this.exibirResultadoNaTabela(data);
       
                        // Salvar no Firestore (Firebase)
                        this.salvarNoFirestore(data);
                    }
                }.bind(this),
                error: function() {
                    MessageToast.show("Erro ao buscar o CEP.");
                    oView.byId("textResult").setText("");
                }
            });
        },

        onBuscarEndereco: function() {
            var oView = this.getView();
            var sCep = oView.byId("inputEndereco").getValue();

            if (sCep === "") {
                MessageToast.show("Por favor, insira um CEP.");
                this._loadHistorico();
                return;
            }

            sCep = sCep.replace(/\D/g, '');

            if (sCep.length !== 8) {
                MessageToast.show("Por favor, insira um CEP válido com 8 dígitos.");
                this._loadHistorico();
                return;
            }

            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");

            var aFilteredHistorico = aHistorico.filter(function(item) {
                return item.cep === sCep;
            });

            oHistoricoModel.setProperty("/historico", aFilteredHistorico);
        },

       
        exibirResultadoNaTabela: function(data) {
            var oView = this.getView();
            var oTable = new Table({
                columns: [
                    new Column({ header: new Label({ text: "Campo" }) }),
                    new Column({ header: new Label({ text: "Valor" }) })
                ]
            });
       
            var oTemplate = new ColumnListItem({
                cells: [
                    new Text({ text: "{campo}" }),
                    new Text({ text: "{valor}" })
                ]
            });
       
            var aData = [
                { campo: "Logradouro", valor: data.logradouro },
                { campo: "Bairro", valor: data.bairro },
                { campo: "Cidade", valor: data.localidade },
                { campo: "Estado", valor: data.uf }
            ];
       
            var oDataModel = new JSONModel();
            oDataModel.setData({ items: aData });
            oTable.setModel(oDataModel);
            oTable.bindItems("/items", oTemplate);
       
            oView.byId("textResult").removeAllItems();
            oView.byId("textResult").addItem(oTable);
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
                    data: dataHoraLocal, // Utiliza a data e hora local
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
        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("LoginCep");
        },

        onUserPress: function () {
            MessageToast.show("Botão do usuário pressionado");
        },

        onMenuButtonPress: function () {
            var oSplitApp = this.byId("SplitApp");
            oSplitApp.toggleMasterPage();
        },

        onLogout: function () {
            firebase.auth().signOut().then(() => {
                MessageToast.show("Logout successful!");
                // Limpar o token de autenticação ou qualquer dado de autenticação armazenado
                localStorage.removeItem('authToken');
                sessionStorage.clear();

                var oView = this.getView();
                var oModel = new JSONModel({ historico: [] });
                oView.setModel(oModel, "historico");

                var oTable = oView.byId("historicoTable");
                oTable.destroyItems();

                this.getOwnerComponent().getRouter().navTo("RouteLoginCep", {}, true);
                //this._clearHistorico();
                // Redirecionar para a tela de login
                //this.getOwnerComponent().getRouter().navTo("LoginCep", {}, true);
            }).catch((error) => {
                MessageToast.show(error.message);
            });

        },

        onMenuSelect: function (oEvent) {
            var sItemId = oEvent.getSource().getId();
            var oPage = this.byId("pageBuscaCep");

            if (sItemId === "container-logincep---BuscaCep--menuItemBuscaCep") {
                oPage.setTitle("Busca CEP");
                this.byId("vboxBuscaCep").setVisible(true);
                this.byId("vboxHistorico").setVisible(false);
            } else if (sItemId === "container-logincep---BuscaCep--menuItemHistorico") {
                oPage.setTitle("Histórico");
                this.byId("vboxBuscaCep").setVisible(false);
                this.byId("vboxHistorico").setVisible(true);
                this._loadHistorico();
            }

            var oSplitApp = this.byId("SplitApp");
            oSplitApp.toDetail(this.createId("pageBuscaCep"));
        },
        onOrdenarCrescente: function() {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
        
            aHistorico.sort(function(a, b) {
                var cepA = parseInt(a.cep.replace(/\D/g, ''), 10); // Remover não dígitos e converter para inteiro
                var cepB = parseInt(b.cep.replace(/\D/g, ''), 10);
        
                return cepA - cepB;
            });
        
            oHistoricoModel.setProperty("/historico", aHistorico);
        },

        onOrdenarDecrescente: function() {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
        
            aHistorico.sort(function(a, b) {
                var cepA = parseInt(a.cep.replace(/\D/g, ''), 10); // Remover não dígitos e converter para inteiro
                var cepB = parseInt(b.cep.replace(/\D/g, ''), 10);
        
                return cepB - cepA;
            });
        
            oHistoricoModel.setProperty("/historico", aHistorico);
        },
        onLimpaOrdenacao : function(){
            this._loadHistorico();
        },

         onGerarRelatorio: function() {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
 
            if (!aHistorico || aHistorico.length === 0) {
                MessageToast.show("Não há dados para gerar relatório.");
                return;
            }
 
            var sContent = "Histórico de Buscas\n\n";
            aHistorico.forEach(function(item) {
                sContent += "Data: " + item.data + "\n";
                sContent += "CEP: " + item.cep + "\n";
                sContent += "Resultado: " + item.resultado + "\n\n";
            });
 
            var sFileName = "historico_buscas.txt";
            var blob = new Blob([sContent], { type: "text/plain;charset=utf-8" });
 
            // Utilizando a API File de UI5 para download do arquivo
            FileUtil.save(blob, sFileName);
        }
    });
});
