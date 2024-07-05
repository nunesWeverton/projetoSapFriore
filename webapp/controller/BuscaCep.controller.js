sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/m/Popover",
    "sap/m/Label",
    "sap/m/Button",
    "sap/m/Dialog",
    "sap/m/TextArea",
    "sap/m/PlacementType",
    "sap/m/HBox",
    "sap/m/VBox",
    "sap/m/ButtonType",
    "sap/m/TitleAlignment",
    "sap/ui/core/HTML"
], function (Controller, MessageToast, JSONModel, Popover, Label, Button, Dialog, TextArea, PlacementType, HBox, VBox, ButtonType , TitleAlignment, HTML) {
    "use strict";

    return Controller.extend("sap.btp.logincep.controller.BuscaCep", {

        onInit: function () {
            // Adiciona um observador de autenticação para garantir que o usuário esteja autenticado
            firebase.auth().onAuthStateChanged(function (user) {
                if (user) {
                    this._loadHistorico();
                } else {
                    MessageToast.show("Usuário não autenticado.");
                }
            }.bind(this));

            var oTable = this.getView().byId("historicoTable");

            // Adicionando o evento de duplo clique na tabela
            oTable.attachBrowserEvent("dblclick", this.onHistoricoItemDblClick.bind(this));
        },

        _loadHistorico: function () {
            var oView = this.getView();
            var db = firebase.firestore();
            var user = firebase.auth().currentUser;

            if (!user) {
                MessageToast.show("Usuário não autenticado.");
                return;
            }

            db.collection("buscaCep")
                .where("userId", "==", user.uid)
                .get()
                .then((querySnapshot) => {
                    var aHistorico = [];
                    querySnapshot.forEach((doc) => {
                        var oData = doc.data();
                        oData.id = doc.id; // Adiciona o ID do documento aos dados
                        aHistorico.push(oData);
                    });

                    var oModel = new JSONModel({ historico: aHistorico });
                    oView.setModel(oModel, "historico");

                    var oTable = oView.byId("historicoTable");
                    var oTemplate = new sap.m.ColumnListItem({
                        cells: [
                            new sap.m.Text({ text: "{historico>data}" }),
                            new sap.m.Text({ text: "{historico>cep}" }),
                            new sap.m.Text({ text: "{historico>resultado}" }),
                            new sap.m.Text({ text: "{historico>descricao}" })
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

        onHistoricoItemDblClick: function (oEvent) {
            var oTable = this.getView().byId("historicoTable");
            var oItem = oTable.getSelectedItem();
            if (!oItem) {
                return;
            }
            var oContext = oItem.getBindingContext("historico");
            var oItemData = oContext.getObject();
            this.mostrarDetalhesHistorico(oItemData, oItem);
        },

        mostrarDetalhesHistorico: function (oItemData, oSelectedItem) {
            var oPopover = new Popover({
                title: "Detalhes do Histórico",
                contentWidth: "350px",
                placement: PlacementType.Vertical,
                titleAlignment : TitleAlignment.Center,
                content: [
                    new VBox({
                        items: [
                            new Label({ text: "Data: " + oItemData.data, design: "Bold", textAlign: "Left", width: "auto" }).addStyleClass("sapUiTinyMarginTop"),
                            new HTML({ content: "<hr>" }),
                            new Label({ text: "CEP: " + oItemData.cep, design: "Bold", textAlign: "Left", width: "auto" }).addStyleClass("sapUiTinyMarginTop"),
                            new HTML({ content: "<hr>" }),
                            new Label({ text: "Resultado: " + oItemData.resultado, design: "Bold", textAlign: "Left", width: "auto" }).addStyleClass("sapUiTinyMarginTop"),
                            new HTML({ content: "<hr>" }),
                            new Label({ text: "Descrição: " + (oItemData.descricao || ""), design: "Bold", textAlign: "Left", width: "auto" }).addStyleClass("sapUiTinyMarginTop"),
                            new HTML({ content: "<hr>" }),
                        ]
                    }).addStyleClass("customPopoverContent"), // Adiciona padding ao conteúdo
                    new HBox({
                        //justifyContent: "SpaceAround",
                        items: [
                            new Button({
                                text: "Editar",
                                press: function () {
                                    if(oItemData.descricao){
                                        this._openEditDialog(oItemData, oSelectedItem);
                                        
                                    }else{
                                        this._openDescricaoDialog(oItemData, oSelectedItem);
                                    }
                                    oPopover.close();
                                }.bind(this)
                            }).addStyleClass("buttonDetalhesHistorico"),
                            new Button({
                                text: "Excluir",
                                press: function () {
                                    this._excluirHistorico(oItemData.id);
                                    oPopover.close();
                                }.bind(this)
                            }).addStyleClass("buttonDetalhesHistorico"),
                            new Button({
                                text: "Adicionar Descrição",
                                press: function () {
                                    if(!oItemData.descricao){
                                        this._openDescricaoDialog(oItemData, oSelectedItem);
                                    }
                                    else  this._openEditDialog(oItemData, oSelectedItem);
                                    
                                    oPopover.close();
                                }.bind(this)
                            }).addStyleClass("buttonDetalhesHistorico"),
                            new Button({
                                text: "Cancelar",
                                press: function () {
                                    oPopover.close();
                                }.bind(this)
                            }).addStyleClass("buttonDetalhesHistorico"),
                        ]
                    }).addStyleClass("buttonMargin")
                ],
                modal: true, // Para fazer o Popover modal
                backgroundColor: "#f0f0f0", // Cor de fundo do Popover
                verticalScrolling: false // Desabilita o scroll vertical
            }).addStyleClass("customPopover"); // Aplica a fonte Arial ao Popover
        
            oPopover.openBy(oSelectedItem);
        },


        _openEditDialog: function (oItemData, oSelectedItem) {
            var oDialog = new Dialog({
                title: "Editar Descrição",
                draggable: true,
                titleAlignment : TitleAlignment.Center,
                content: [
                    new TextArea("editDescricaoTextArea", {
                        value: oItemData.descricao || "",
                        width: "100%",
                        placeholder: "Adicionar descrição...",
                    }).addStyleClass("customTextArea1")
                ],
                beginButton: new Button({
                    text: "Salvar",
                    press: function () {
                        var sDescricao = sap.ui.getCore().byId("editDescricaoTextArea").getValue();
                        this._salvarDescricao(oItemData.id, sDescricao, oSelectedItem);
                        oDialog.close();
                        oDialog.destroy();
                    }.bind(this)
                }).addStyleClass("customSaveButton"),
                endButton: new Button({
                    text: "Cancelar",
                    press: function () {
                        oDialog.close();
                        oDialog.destroy();
                    }
                }).addStyleClass("customCancelButton")
            })

            oDialog.open();
        },

        // _openEditDialog: function (oItemData, oSelectedItem) {
        //     // Criando elementos HTML equivalentes ao diálogo e seus componentes
        //     var dialogDiv = document.createElement("div");
        //     dialogDiv.classList.add("customDialog"); // Adiciona classe de estilo para personalização adicional do diálogo
        //     dialogDiv.style.width = "300px"; // Definindo largura do diálogo
        //     dialogDiv.style.height = "200px"; // Definindo altura do diálogo
        //     dialogDiv.style.top = "50%";
        //     dialogDiv.style.left = "50%";
        //     dialogDiv.style.transform = "translate(-50%, -50%)";
        
        //     var dialogTitle = document.createElement("h2");
        //     dialogTitle.textContent = "Editar Descrição";
        //     dialogDiv.appendChild(dialogTitle);
        
        //     var editDescricaoTextArea = document.createElement("textarea");
        //     editDescricaoTextArea.id = "editDescricaoTextArea";
        //     editDescricaoTextArea.classList.add("customTextArea");
        //     editDescricaoTextArea.style.width = "100%"; // Definindo largura do TextArea como 100% do diálogo
        //     editDescricaoTextArea.placeholder = "Adicionar descrição...";
        //     editDescricaoTextArea.value = oItemData.descricao || "";
        //     dialogDiv.appendChild(editDescricaoTextArea);
        
        //     var buttonsDiv = document.createElement("div");
        //     buttonsDiv.classList.add("buttonsContainer");
        
        //     var salvarButton = document.createElement("button");
        //     salvarButton.textContent = "Salvar";
        //     salvarButton.classList.add("customSaveButton");
        //     salvarButton.type = "button";
        //     salvarButton.addEventListener("click", function () {
        //         var sDescricao = editDescricaoTextArea.value;
        //         this._salvarDescricao(oItemData.id, sDescricao, oSelectedItem);
        //         dialogDiv.remove(); // Fecha o diálogo removendo-o do DOM
        //     }.bind(this));
        //     buttonsDiv.appendChild(salvarButton);
        
        //     var cancelarButton = document.createElement("button");
        //     cancelarButton.textContent = "Cancelar";
        //     cancelarButton.classList.add("customCancelButton");
        //     cancelarButton.type = "button";
        //     cancelarButton.addEventListener("click", function () {
        //         dialogDiv.remove(); // Fecha o diálogo removendo-o do DOM
        //     });
        //     buttonsDiv.appendChild(cancelarButton);
        
        //     dialogDiv.appendChild(buttonsDiv);
        
        //     // Adicionando o diálogo ao corpo do documento
        //     document.body.appendChild(dialogDiv);
        // },
        
        

        _openDescricaoDialog: function (oItemData, oSelectedItem) {
            var oDialog = new Dialog({
                title: "Adicionar Descrição",
                draggable: true,
                titleAlignment : TitleAlignment.Center,
                content: [
                    new TextArea("descricaoTextArea", {
                        value: oItemData.descricao || "",
                        width: "100%", // Definindo largura do TextArea como 70% do diálogo
                        placeholder: "Adicionar descrição...",
                    }).addStyleClass("customTextArea")
                ],
                beginButton: new Button({
                    text: "Salvar",
                    type: ButtonType.Transparent, // Define o tipo de botão como transparente para remover o estilo padrão
                    press: function () {
                        var sDescricao = sap.ui.getCore().byId("descricaoTextArea").getValue();
                        this._salvarDescricao(oItemData.id, sDescricao, oSelectedItem);
                        oDialog.close();
                        oDialog.destroy();
                    }.bind(this)
                }).addStyleClass("customSaveButton"), // Adiciona classe de estilo para personalização
        
                endButton: new Button({
                    text: "Cancelar",
                    //type: ButtonType.Transparent, // Define o tipo de botão como transparente para remover o estilo padrão
                    press: function () {
                        oDialog.close();
                        oDialog.destroy();
                    }
                }).addStyleClass("customCancelButton") // Adiciona classe de estilo para personalização
            });
        
            oDialog.addStyleClass("customDialog"); // Adiciona classe de estilo para personalização adicional do diálogo
            oDialog.open();
        },

        
        

        _salvarDescricao: function (sId, sDescricao, oSelectedItem) {
            var db = firebase.firestore();
            db.collection("buscaCep").doc(sId).update({
                descricao: sDescricao
            }).then(function () {
                MessageToast.show("Descrição salva com sucesso!");
                var oContext = oSelectedItem.getBindingContext("historico");
                oContext.getModel().setProperty(oContext.getPath() + "/descricao", sDescricao);
            }).catch(function (error) {
                console.error("Erro ao salvar descrição: ", error);
                MessageToast.show("Erro ao salvar descrição.");
            });
        },

        

        _excluirHistorico: function (sId) {
            var oDialog = new Dialog({
                title: "Deseja excluir?",
                draggable: true,
                titleAlignment : TitleAlignment.Center,
                content: [
                    new HBox({
                        justifyContent: "Center", // Centraliza os botões horizontalmente
                        items: [
                            new Button({
                                text: "Sim",
                                press: function () {
                                    this._excluirItem(sId);
                                    oDialog.close();
                                    oDialog.destroy();
                                }.bind(this)
                            }).addStyleClass("buttonDetalhesHistorico buttonSim"),
                            new Button({
                                text: "Não",
                                press: function () {
                                    oDialog.close();
                                    oDialog.destroy();
                                }
                            }).addStyleClass("buttonDetalhesHistorico")
                        ]
                    }).addStyleClass("buttonSpacing") // Adiciona espaçamento entre os botões
                ]
            }).addStyleClass("desejaExcluir");

            oDialog.open();
        },

        _excluirItem: function (sId) {
            var db = firebase.firestore();
            db.collection("buscaCep").doc(sId).delete().then(function () {
                MessageToast.show("Item excluído com sucesso!");
                this._loadHistorico(); // Recarregar o histórico
            }.bind(this)).catch(function (error) {
                console.error("Erro ao excluir histórico: ", error);
                MessageToast.show("Erro ao excluir histórico.");
            });
        }, 
        onBuscarCep: function () {
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
                success: function (data) {
                    if (data.erro) {
                        MessageToast.show("CEP não encontrado.");
                        oView.byId("textResult").setText("");
                    } else {
                        var oModel = new JSONModel(data);
                        oView.setModel(oModel, "cep");
        
                        var vboxBuscaCep = oView.byId("vboxBuscaCep");
                        if (vboxBuscaCep.getVisible()) {
                            this.exibirResultadoNaTabela(data);
                            this.salvarNoFirestore(data);
                        } else {
                            console.error('A VBox "vboxBuscaCep" não está visível.');
                            MessageToast.show("Erro ao exibir o resultado. A seção de busca não está visível.");
                        }
                    }
                }.bind(this),
                error: function () {
                    MessageToast.show("Erro ao buscar o CEP.");
                    oView.byId("textResult").setText("");
                }
            });
        },
        

        exibirResultadoNaTabela: function (data) {
            var aData = [
                { campo: "Logradouro", valor: data.logradouro },
                { campo: "Bairro", valor: data.bairro },
                { campo: "Cidade", valor: data.localidade },
                { campo: "Estado", valor: data.uf }
            ];
        
            var tableHtml = '<table class="resultTable">';
            tableHtml += '<thead><tr><th>Campo</th><th>Valor</th></tr></thead><tbody>';
        
            aData.forEach(function (item) {
                tableHtml += '<tr><td>' + item.campo + '</td><td>' + item.valor + '</td></tr>';
            });
        
            tableHtml += '</tbody></table>';
        
            var textResultDiv = document.getElementById("container-sap.btp.logincep---BuscaCep--textResult");
            
            //console.log(this.getView().byId("textResult").innerHTML)
            //textResultDiv.setVisible = true
            textResultDiv.innerHTML = tableHtml;
           
        },

        salvarNoFirestore: function (data) {
            var db = firebase.firestore();
            var user = firebase.auth().currentUser;

            if (!user) {
                MessageToast.show("Usuário não autenticado.");
                return;
            }

            var oHistorico = {
                userId: user.uid,
                cep: data.cep,
                resultado:  data.logradouro + ", " + data.bairro + ", " + data.localidade + ", " + data.uf,
                descricao: "", // Descrição inicial vazia
                data: new Date().toLocaleString() // Adiciona a data e hora atuais
            };

            db.collection("buscaCep").add(oHistorico)
                .then(function (docRef) {
                    MessageToast.show("CEP salvo no histórico!");
                    this._loadHistorico();
                }.bind(this))
                .catch(function (error) {
                    console.error("Erro ao salvar no Firestore: ", error);
                    MessageToast.show("Erro ao salvar no Firestore.");
                });
        },

        onBack: function () {
            this.getOwnerComponent().getRouter().navTo("LoginCep");
        },

        onUserPress: function () {
            MessageToast.show("Botão do usuário pressionado");
            console.log("teste usuaria -> ", firebase.auth().currentUser);
        },

        onMenuSelect: function (oEvent) {
            var sItemId = oEvent.getSource().getId();
            console.log(sItemId)
            var oPage = this.byId("pageBuscaCep");

            this.byId("inputCep").setValue("");

            if (sItemId === "container-sap.btp.logincep---BuscaCep--menuItemBuscaCep") {
                oPage.setTitle("Busca CEP");
                this.byId("vboxBuscaCep").setVisible(true);
                this.byId("vboxHistorico").setVisible(false);
            } else if (sItemId === "container-sap.btp.logincep---BuscaCep--menuItemHistorico") {
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
                document.getElementById("container-sap.btp.logincep---BuscaCep--textResult").innerHTML = '';
                this.byId("inputCep").setValue("");
                this.getOwnerComponent().getRouter().navTo("RouteLoginCep");
            }).catch((error) => {
                MessageToast.show(error.message);
            });
        },

        onBuscarEndereco: function () {
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

            var aFilteredHistorico = aHistorico.filter(function (item) {
                var sItemCepNormalizado = item.cep.replace(/\D/g, '');
                return sItemCepNormalizado === sCepNormalizado;
            });

            if (aFilteredHistorico.length === 0) {
                this._loadHistorico();
                return;
            }

            oHistoricoModel.setProperty("/historico", aFilteredHistorico);
        },

        onOrdenarCrescente: function () {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");

            aHistorico.sort(function (a, b) {
                var dataA = new Date(a.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                var dataB = new Date(b.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();

                return dataA - dataB;
            });

            oHistoricoModel.setProperty("/historico", aHistorico);
        },

        onOrdenarDecrescente: function () {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");

            aHistorico.sort(function (a, b) {
                var dataA = new Date(a.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                var dataB = new Date(b.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();

                return dataB - dataA;
            });

            oHistoricoModel.setProperty("/historico", aHistorico);
        },

        onLimpaOrdenacao: function () {
            this._loadHistorico();
        },

        onGerarRelatorio: function () {
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

            oHistoricoTable.getColumns().forEach(function (oColumn) {
                sTableContent += "<th>" + oColumn.getHeader().getText() + "</th>";
            });
            sTableContent += `
                            </tr>
                        </thead>
                        <tbody>`;

            oHistoricoTable.getItems().forEach(function (oItem) {
                sTableContent += "<tr>";
                oItem.getCells().forEach(function (oCell) {
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

            setTimeout(function () {
                oHistoricoTable.setVisible(bTableVisible);
            }, 1000);
        }
    });
});
