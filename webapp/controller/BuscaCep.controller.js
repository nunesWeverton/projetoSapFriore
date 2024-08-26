
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
    "sap/ui/core/HTML",
    "sap/ui/core/BusyIndicator",
    'sap/ui/model/odata/v2/ODataModel',
    'sap/ui/core/util/MockServer',
    "sap/ui/export/library",
    "sap/ui/export/Spreadsheet",
    "sap/ui/unified/FileUploader",
    "sap/suite/ui/commons/imageeditor/ImageEditor",
	"sap/suite/ui/commons/imageeditor/ImageEditorContainer"
    
 
], function(Controller,  MessageToast, JSONModel, Popover, Label, Button, Dialog, TextArea, PlacementType, HBox, VBox, ButtonType , TitleAlignment, HTML,BusyIndicator, ODataModel, MockServer, ImageEditor, ImageEditorContainer ) {
    "use strict";

    // const { Edm, EntityType, Property, Schema, EntityContainer } = require('odata-v4-metadata');
    var sUrl = 'https://api-btp-dev.azurewebsites.net/api';

    return Controller.extend("logincep.controller.BuscaCep", {


    //      jsonToODataMetadata: function(json, entityName) {
    //         const schema = new Schema("MyNamespace");
    //         const entity = new EntityType(entityName);

    //         for (let key in json) {
    //             if (json.hasOwnProperty(key)) {
    //                 const value = json[key];
    //                 let type = typeof value;

    //                 let odataType = "Edm.String"; // Default type
    //                 switch (type) {
    //                     case 'string':
    //                         odataType = "Edm.String";
    //                         break;
    //                     case 'number':
    //                         odataType = Number.isInteger(value) ? "Edm.Int32" : "Edm.Decimal";
    //                         break;
    //                     case 'boolean':
    //                         odataType = "Edm.Boolean";
    //                         break;
    //                     case 'object':
    //                         if (value !== null && !Array.isArray(value)) {
    //                             // Handle nested objects as complex types
    //                             const nestedEntityName = `${entityName}_${key}`;
    //                             schema.addEntityType(jsonToODataMetadata(value, nestedEntityName));
    //                             odataType = `MyNamespace.${nestedEntityName}`;
    //                         }
    //                         break;
    //                     // Add other cases as needed
    //                 }

    //                 entity.addProperty(new Property(key, odataType));
    //             }
    //         }

    //     schema.addEntityType(entity);
    //     return entity;
    // },

    
    
    // Exemplo de uso
   

        onInit: function() {

            this._bSortAscending  = true;
            var oTable = this.getView().byId("historicoTable");
            oTable.attachBrowserEvent("dblclick", this.onHistoricoItemDblClick.bind(this));
            this._loadHistorico();

            var oMockServer = new MockServer({
                rootUri: "/odata/service/"
            });

            // Caminho para o arquivo metadata.xml e mockdata
            var sPath = sap.ui.require.toUrl("sap/btp/logincep/localService");
            oMockServer.simulate(sPath + "/metadata.xml", {
                sMockdataBaseUrl: sPath + "/mockdata",
                // bGenerateMissingMockData: true
            });

            oMockServer.start();

            // Cria o modelo OData com a URL do mock server
            var oModel = new ODataModel("/odata/service/", {
                defaultCountMode: "Inline"
            });

            // Associa o modelo à view
            this.getView().setModel(oModel);

    
        },
       
        _loadHistorico: function() {
            BusyIndicator.show(0);
            var uId = localStorage.getItem('localId');
      
            $.ajax({
                url: sUrl + '/buscaCep/getAllByUserId?userId=' + uId,
                method: "GET",
                contentType: "application/json",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                success: (data) => {
                    this.createHistoricTable(data);
                    // this.createHistoricTableSmart(data);
                    BusyIndicator.hide()
                },
                error: () => {
                    MessageToast.show("Erro ao buscar histórico.");
                    BusyIndicator.hide()
                }
            });
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
                    new sap.m.Text({ text: "{historico>resultado}" }),
                    new sap.m.Text({ text: "{historico>descricao}" }),
                    new HBox ({
                        items : [
                            new sap.m.Button({
                                icon: "sap-icon://edit",
                                press: function(oEvent) {
                                    var oSelectedItem = oEvent.getSource().getParent();
                                    var oContext = oSelectedItem.getBindingContext("historico");
                                    var oItemData = oContext.getObject();
                                    this._openEditDialog(oItemData, oSelectedItem);
                                }.bind(this)
                            }).addStyleClass("btnEdition"),
                            new sap.m.MenuButton({
                                icon: "sap-icon://camera",
                                menu: new sap.m.Menu({
                                    items: [
                                        new sap.m.MenuItem({
                                            text: "Carregar Imagem",
                                            icon: "sap-icon://upload",
                                            press: function (oEvent) {
                                                var sFileUploaderId = "fileUploader_" + Date.now();
                                                var oSelectedItem = oEvent.getSource().getParent().getParent().getParent();
                                                var oContext = oSelectedItem.getBindingContext("historico");
                                                var oItemData = oContext.getObject();

                                                // Cria o FileUploader com um id
                                                var oFileUploader = new sap.ui.unified.FileUploader(sFileUploaderId, {
                                                    name: "myFileUploader",
                                                    buttonOnly: true,
                                                    multiple: false,
                                                    uploadOnChange: false,
                                                    change: function (oEvent) {
                                                        // Handle file selection
                                                        if (oEvent.getParameter("newValue")) {
                                                            // Enable the send button when a file is selected
                                                            oDialog.getBeginButton().setEnabled(true);
                                                        }
                                                    }
                                                });
                                        
                                                var oSendButton = new sap.m.Button({
                                                    text: "Enviar",
                                                    enabled: false,
                                                    press: function (oEvent) {
                                                        var oFile = sap.ui.getCore().byId(sFileUploaderId).oFileUpload.files[0];
                                                        if (oFile) {
                                                            this.handleUploadPress(oFile, oItemData);
                                                            oDialog.close();
                                                        } else {
                                                            sap.m.MessageToast.show("Nenhum arquivo selecionado.");
                                                        }
                                                    }.bind(this)
                                                });
                                        
                                                var oDialog = new sap.m.Dialog({
                                                    title: "Carregar Imagem",
                                                    content: [oFileUploader],
                                                    beginButton: oSendButton,
                                                    endButton: new sap.m.Button({
                                                        text: "Fechar",
                                                        press: function () {
                                                            oDialog.close();
                                                        }
                                                    }),
                                                    afterClose: function () {
                                                        oDialog.destroy();
                                                    }
                                                });
                                        
                                                // Adiciona o Dialog à view
                                                oView.addDependent(oDialog);
                                                oDialog.open();
                                            }.bind(this)
                                        }),
                                        new sap.m.MenuItem({
                                            text: "Ver Imagem",
                                            icon: "sap-icon://show",
                                            press: function (oEvent) {
                                                var oSelectedItem = oEvent.getSource().getParent().getParent().getParent();
                                                var oContext = oSelectedItem.getBindingContext("historico");
                                                var oItemData = oContext.getObject();
                                                this.imageRequisition(oItemData);
                                            }.bind(this)
                                        })
                                    ]
                                })
                            }),
                            new sap.m.Button({
                                icon: "sap-icon://delete",
                                press: function(oEvent) {
                                    var oSelectedItem = oEvent.getSource().getParent();
                                    var oContext = oSelectedItem.getBindingContext("historico");
                                    var oItemData = oContext.getObject();
                                    this._excluirHistorico(oItemData.id);
                                }.bind(this)
                            }).addStyleClass("btnDelete")
                        ]
                    }).addStyleClass("hboxBtnEditonDelete"),
                    
                ]
            }).addStyleClass("historyTable")

            oTable.bindItems({
                path: "historico>/historico",
                template: oTemplate
            });
            // oTable.attachItemPress(function(oEvent) {
            //     var oSelectedItem = oEvent.getParameter("listItem");
            //     var oContext = oSelectedItem.getBindingContext("historico");
            //     var oItemData = oContext.getObject();
            //     console.log(oItemData);
            //     this.mostrarDetalhesHistorico(oItemData, oSelectedItem);
            // }.bind(this));

            oTable.addStyleClass("historicoTableStyle");
            var itemCountText = oView.byId("itemCountText");
            var itemCount = aHistorico.length;
            itemCountText.setText(itemCount + " Registros");
        },


        onHistoricoItemDblClick: function (oEvent) {
            var oTable = this.getView().byId("historicoTable");
            var oItem = oTable.getSelectedItem();
            if (!oItem) {
                return;
            }
            var oContext = oItem.getBindingContext("historico");
            var oItemData = oContext.getObject();
            // this.mostrarDetalhesHistorico(oItemData, oItem);
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
                title: "EDITAR DESCRIÇÃO",
                draggable: true,
                content: [
                    new VBox({
                        items : [
                            new Label({ text: "Descrição " }).addStyleClass("labelDescription"),
                            new TextArea("editDescricaoTextArea", {
                                value: oItemData.descricao || "",
                                width: "100%",
                                placeholder: "Adicionar descrição",
                            }).addStyleClass("customTextArea1"),
                            new HBox({
                                items:[
                                    new Button({
                                        id: "saveId",
                                        text: "Salvar",
                                        press: function () {
                                            var sDescricao = sap.ui.getCore().byId("editDescricaoTextArea").getValue();
                                            this._salvarDescricao(oItemData.id, sDescricao, oSelectedItem);
                                            oDialog.close();
                                            oDialog.destroy();
                                        }.bind(this)
                                    }).addStyleClass("customSaveButton"),
                                    new Button({
                                        id: "cancelId",
                                        text: "Cancelar",
                                        press: function () {
                                            oDialog.close();
                                            oDialog.destroy();
                                        }
                                    }).addStyleClass("customCancelButton")
                                ]
                            }).addStyleClass("hboxButton")
                            
                        ]
                    }).addStyleClass("contentDescription")
                ],
                // beginButton: 
                // endButton: 
            }).addStyleClass("dialogClass")

            oDialog.open();
        },


        _salvarDescricao: function (sId, sDescricao, oSelectedItem) {
            BusyIndicator.show(0);
            $.ajax({
                url: sUrl + "/buscaCep",
                method: "PUT",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                contentType: "application/json",
                data: JSON.stringify({
                    id : sId,
                    descricao : sDescricao,
                    userId : localStorage.getItem("localId")
                }),
                success: () => {
                    
                    //var oContext = oSelectedItem.getBindingContext("historico");
                    //oContext.getModel().setProperty(oContext.getPath() + "/descricao", sDescricao);
                    this._loadHistorico();
                    MessageToast.show("descrição adicionada");
                    BusyIndicator.hide();
                },
                error: () => {
                    MessageToast.show("Erro ao salvar descrição.");
                    BusyIndicator.hide();
                }


            });

             
        },  

        
        
        _excluirHistorico: function (sId) {
            var oDialog = new Dialog({
                id: "excluir",
                title: "DESEJA EXCLUIR?",
                draggable: true,
                titleAlignment: TitleAlignment.Center,
                content: [
                    new HBox({
                        justifyContent: "Center", 
                        items: [
                            new Button({
                                id: "yes",
                                text: "Sim",
                                press: function () {
                                    this._excluirItem(sId);
                                    oDialog.close();
                                    oDialog.destroy();
                                }.bind(this)
                            }).addStyleClass("buttonYes"),
                            new Button({
                                id: "no",
                                text: "Não",
                                press: function () {
                                    oDialog.close();
                                    oDialog.destroy();
                                }
                            }).addStyleClass("buttonNo") 
                        ]
                    }).addStyleClass("buttonSpacing") 
                ]
            }).addStyleClass("desejaExcluir"); 
        
            oDialog.open();
        },

        handleUploadPress: function (file, oItemData) {

            var rId = oItemData.id;
        
            if (file) {
                var formData = new FormData();
                formData.append("file", file);
        
                BusyIndicator.show(0);
        
                $.ajax({
                    url: sUrl + '/buscaCep/UploadImage?buscaCepId=' + rId,
                    method: "PUT",
                    headers: {
                        Authorization: "Bearer " + localStorage.getItem("idToken")
                    },
                    processData: false,
                    contentType: false, 
                    data: formData,
                    success: (data) => {
                        MessageToast.show("File uploaded successfully!");
                        BusyIndicator.hide();
                    },
                    error: (jqXHR, textStatus, errorThrown) => {
                        console.error("Error during upload:", textStatus, errorThrown);
                        MessageToast.show("Error uploading the file. Please try again.");
                        BusyIndicator.hide();
                    }
                });
        
            } else {
                MessageToast.show("Please select a file to upload.");
            }
        },

        imageRequisition: function (oItemData){
            var rId = oItemData.id;
       
            $.ajax({
                url: sUrl + '/buscaCep/GetImageByIdRegister?buscaCepId=' + rId,
                type: "GET",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                success: (response) => {
                    sap.m.MessageToast.show("Image retrieved successfully!");
                    this.onViewImage(response)
                    
                },
                error: (xhr, status, error) => {
                    sap.m.MessageToast.show("Failed to retrieve image: " + xhr.responseText);
                }
            });
        },

        onViewImage: function (data) {
            var oController = this;

			if (!this.oDialog) {
				this.oDialog = new Dialog({
					title: 'Image Editor',
					verticalScrolling: false,
					stretch: true,
					content: [
						new ImageEditorContainer({
						    imageEditor: new ImageEditor({
                                id: oController.createId("imageEditor")
                        })
						})
					],
					beginButton: new Button({
						text: 'Close',
						press: function () {
							oController.oDialog.close();
						}
					})
				});
			}

            var oImageEditor = this.byId("imageEditor");
            oImageEditor.setSrc(data.dataUrl);

			this.oDialog.open();
        },


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
        

        _excluirItem: function (sId) {
            BusyIndicator.show(0);
            $.ajax({
                url: sUrl + "/buscaCep?id="+ sId,
                method: "DELETE",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                contentType: "application/json",
                success: () => {
                    MessageToast.show("Item excluído com sucesso!");
                    this._loadHistorico();
                    BusyIndicator.hide();
                },
                error: () => {
                    MessageToast.show("Erro ao excluir histórico.");
                    BusyIndicator.hide();
                }
            });
         
        }, 

 
        onBuscarCep: async function() {
            var oView = this.getView();
            var sCep = oView.byId("inputCep").getValue();
         
            if (sCep === "") {
                MessageToast.show("Por favor, insira um CEP.", {
                    duration: 1500, // duração em milissegundos
                    closeOnBrowserNavigation: false,
                    my: "center center",
                    at: "center center",
                    className: "customMessageToast"
                });
                return;
            }
         
            sCep = sCep.replace(/\D/g, '');
         
            if (sCep.length !== 8) {
                MessageToast.show("Por favor, insira um CEP válido com 8 dígitos.", {
                    duration: 2000, // duração em milissegundos
                    closeOnBrowserNavigation: false,
                    my: "center center",
                    at: "center center",
                    className: "customMessageToast"
                });
                return;
            }
         
            var sUrl = "https://viacep.com.br/ws/" + sCep + "/json/";
            $.ajax({
                url: sUrl,
                method: "GET",
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                success: async function(data) {
                    if (data.erro === "true") {
                        MessageToast.show("CEP não encontrado.", {
                            duration: 2000, // duração em milissegundos
                            closeOnBrowserNavigation: false,
                            my: "center center",
                            at: "center center",
                            className: "customMessageToast"
                        });
                        oView.byId("textResult").setText("o cep esta errado");
                    } else {
                        var oModel = new JSONModel(data);
                        oView.setModel(oModel, "cep");
                        this.salvarNoFirestore(data);
                        await this._esperar(2000);
                        this._loadHistorico();
                        this.onOrdena();
                    }
                }.bind(this),
                error: function() {
                    MessageToast.show("Erro ao buscar o CEP.");
                    oView.byId("textResult").setText("");
                }
            });
        },
         
        _esperar: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                contentType: "application/json",
                data: JSON.stringify({
                    data: dataHoraLocal,
                    cep: data.cep,
                    resultado: data.logradouro + ", " + data.bairro + ", " + data.localidade + ", " + data.uf,
                    userId: uId
                }),
                success: () => {
                    MessageToast.show("Busca salva com sucesso!", {
                        duration: 2000, // duração em milissegundos
                        closeOnBrowserNavigation: false,
                        my: "center center",
                        at: "center center",
                        addStyleClass: "customMessageToast"
                    });
                   
                },
                error: () => {
                    MessageToast.show("Erro ao tentar fazer registro.", {
                        duration: 2000, // duração em milissegundos
                        closeOnBrowserNavigation: false,
                        my: "center center",
                        at: "center center",
                        className: "customMessageToast"
                    });
                }
            });

        },

        
 
        onBack: function() {
            this.getOwnerComponent().getRouter().navTo("RouteLoginCep");
        },
 
        onUserPress: function() {
            MessageToast.show("Botão do usuário pressionado");
        },

        onMenuButtonPress: function(oEvent) {
            
            var oButton = oEvent.getSource();
            var oMenuList = this.getView().byId("menuList");

            // Torna o List visível apenas se o botão não estiver clicado
            if (!oButton.data("clicked")) {
                oMenuList.setVisible(true);
            }
            
        },

 
        onMenuSelect: function(oEvent) {
            var sItemId = oEvent.getSource().getId();
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
            BusyIndicator.show(0);
            $.ajax({
                url: sUrl + '/account/logout?localId='+ localStorage.getItem("localId"),
                method: "POST",
                contentType: "application/json",
                success: () => {
                    localStorage.clear()
                    MessageToast.show("Logout feito com sucesso");
                    // this.byId("vboxBuscaCep").setVisible(true);
                    // this.byId("vboxHistorico").setVisible(false);
                    //document.getElementById("container-sap.btp.logincep---BuscaCep--textResult").innerHTML = '';
                    this.byId("inputCep").setValue("");
                    BusyIndicator.hide()
                    this.getOwnerComponent().getRouter().navTo("RouteLoginCep")
                },
                error: () => {
                    MessageToast.show("Erro ao tentar fazer logout.");
                    BusyIndicator.hide()
                }
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
                headers: {
                    Authorization: "Bearer " + localStorage.getItem("idToken")
                },
                contentType: "application/json",
                success: (data) => {
                    var oHistoricoModel = oView.getModel("historico");
                    oHistoricoModel.setProperty("/historico", data);
                    var itemCountText = oView.byId("itemCountText");
                    var itemCount = data.length;
                    itemCountText.setText(itemCount + " Registros");
                },
                error: () => {
                    MessageToast.show("Não há nenhum registro com este CEP.");
                }
            });
            }      
            
        },


        // onOrdenarCrescenteCep: function() {
        //     console.log("gygysyaz")
        //     var oView = this.getView();
        //     var oHistoricoModel = oView.getModel("historico");
        //     var aHistorico = oHistoricoModel.getProperty("/historico");
       
        //     aHistorico.sort(function(a, b) {
                
        //         return a.cep - b.cep;
        //     });
       
        //     oHistoricoModel.setProperty("/historico", aHistorico);
        // },
        
        onOrdenar : function (){

            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");
            
            aHistorico.sort(function(a, b) {
                var dataA = new Date(a.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                var dataB = new Date(b.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                return  dataA - dataB;
            });

            oHistoricoModel.setProperty("/historico", aHistorico);
        },
 
        onOrdenarCrescenteDecrescente: function(oButton, type) {
            var oView = this.getView();
            var oHistoricoModel = oView.getModel("historico");
            var aHistorico = oHistoricoModel.getProperty("/historico");

            var sortButtonClass = oButton.aCustomStyleClasses[0];

            switch(sortButtonClass){

                case "btnDataSort":
                    aHistorico.sort(function(a, b) {
                        var dataA = new Date(a.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();
                        var dataB = new Date(b.data.replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})/, '$2/$1/$3 $4:$5:$6')).getTime();

                        return type === "crescente" ? dataA - dataB : dataB - dataA;
                    });
                break;

                case "btnCepSearch":
                    aHistorico.sort(function(a, b) {
                        var cepA = parseInt(a.cep.replace('-', ''), 10);
                        var cepB = parseInt(b.cep.replace('-', ''), 10);
                        return type === "crescente" ? cepA - cepB : cepB - cepA;
                    });
                 break;

                 case "btnSortResult":
                    aHistorico.sort(function(a, b) {
                       return type === "crescente" ? a.cep.localeCompare(b.cep) : b.cep.localeCompare(a.cep);
                    });
                 break;
            }
    
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
        <h2>Histórico de Buscas</h2>
        <div class="datetime">Emitido em: ${sDateTime}</div>
        </header>
        <div class="table-container">
        <table>
        <thead>
        <tr>`;
        var aVisibleColumns = [];
            oHistoricoTable.getColumns().forEach(function(oColumn) {
                var oHeader = oColumn.getHeader();
                var sColumnName = "";
        
                if (oHeader && oHeader.getText) {
                    sColumnName = oHeader.getText();
                } else {
                    sColumnName = oHeader.getDomRef() ? oHeader.getDomRef().textContent : "N/A";
                }
        
                sColumnName = sColumnName.replace("Ordenar", "").trim();
        
                if (sColumnName !== "Acões") {
                    sTableContent += "<th>" + sColumnName + "</th>";
                    aVisibleColumns.push(oColumn);
                }
            });
         
            sTableContent += `
        </tr>
        </thead>
        <tbody>`;
         
            oHistoricoTable.getItems().forEach(function(oItem) {
                sTableContent += "<tr>";
                oItem.getCells().forEach(function(oCell) {
                    if (oCell instanceof sap.m.Text) {
                        sTableContent += "<td>" + oCell.getText() + "</td>";
                    } else {
                        // Trate outros tipos de células, se necessário
                        // Você pode querer ignorar células que não são do tipo Text
                    }
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
        },
        
        formatCep: function(value) {
            // Remove tudo que não é dígito
            value = value.replace(/\D/g, '');

            // Adiciona a máscara no formato 00000-000
            if (value.length > 5) {
                value = value.replace(/(\d{5})(\d{3})/, '$1-$2');
            }

            return value;
        },
        onLiveChange: function(oEvent) {
            var oInput = oEvent.getSource();
            var sValue = oInput.getValue();

            // Formatar o valor do CEP
            var sFormattedValue = this.formatCep(sValue);

            // Definir o valor formatado no input
            oInput.setValue(sFormattedValue);
        },

        onToggleSort : function (oEvent){
                
            var oButton = oEvent.getSource();
            var sIcon = this._bSortAscending ? "sap-icon://sort-ascending" : "sap-icon://sort-descending";


            oButton.setIcon(sIcon);

            if( this._bSortAscending){
                this. onOrdenarCrescenteDecrescente(oButton, "crescente")
            }
            else{
                this. onOrdenarCrescenteDecrescente(oButton, "decrescente")
            }

            this._bSortAscending = !this._bSortAscending;
        },

        onGerarPDF: function () {
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
        <h2>Histórico de Buscas</h2>
        <div class="datetime">Emitido em: ${sDateTime}</div>
        </header>
        <div class="table-container">
        <table>
        <thead>
        <tr>`;
            var aVisibleColumns = [];
            oHistoricoTable.getColumns().forEach(function (oColumn) {
                var oHeader = oColumn.getHeader();
                var sColumnName = "";

                if (oHeader && oHeader.getText) {
                    sColumnName = oHeader.getText();
                } else {
                    sColumnName = oHeader.getDomRef() ? oHeader.getDomRef().textContent : "N/A";
                }

                sColumnName = sColumnName.replace("Ordenar", "").trim();

                if (sColumnName !== "Acões") {
                    sTableContent += "<th>" + sColumnName + "</th>";
                    aVisibleColumns.push(oColumn);
                }
            });

            sTableContent += `
        </tr>
        </thead>
        <tbody>`;

            oHistoricoTable.getItems().forEach(function (oItem) {
                sTableContent += "<tr>";
                oItem.getCells().forEach(function (oCell) {
                    if (oCell instanceof sap.m.Text) {
                        sTableContent += "<td>" + oCell.getText() + "</td>";
                    } else {
                        // Trate outros tipos de células, se necessário
                        // Você pode querer ignorar células que não são do tipo Text
                    }
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
        },

        onGerarExcel: function () {
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

            var aVisibleColumns = [];
            var aData = [];

            // Adicionar cabeçalhos
            var aHeaders = [];
            oHistoricoTable.getColumns().forEach(function (oColumn) {
                var oHeader = oColumn.getHeader();
                var sColumnName = "";

                if (oHeader && oHeader.getText) {
                    sColumnName = oHeader.getText();
                } else {
                    sColumnName = oHeader.getDomRef() ? oHeader.getDomRef().textContent : "N/A";
                }

                sColumnName = sColumnName.replace("Ordenar", "").trim();

                if (sColumnName !== "Acões") {
                    aHeaders.push(sColumnName);
                    aVisibleColumns.push(oColumn);
                }
            });
            aData.push(aHeaders);

            // Adicionar dados
            oHistoricoTable.getItems().forEach(function (oItem) {
                var aRowData = [];
                oItem.getCells().forEach(function (oCell) {
                    if (oCell instanceof sap.m.Text) {
                        aRowData.push(oCell.getText());
                    } else {
                        // Trate outros tipos de células, se necessário
                        // Você pode querer ignorar células que não são do tipo Text
                    }
                });
                aData.push(aRowData);
            });

            // Criar e exportar o arquivo Excel
            var wb = XLSX.utils.book_new();
            var ws = XLSX.utils.aoa_to_sheet(aData);
            XLSX.utils.book_append_sheet(wb, ws, "Histórico de Buscas");

            XLSX.writeFile(wb, "Relatorio_Historico_Buscas.xlsx");

            setTimeout(function () {
                oHistoricoTable.setVisible(bTableVisible);
            }, 1000);
        },

        onImportarExcel: function (oEvent) {
            var oView = this.getView();
            var fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
        
            fileInput.addEventListener('change', (event) => { 
                var file = event.target.files[0];
                if (file) {
                    var reader = new FileReader();
        
                    reader.onload = (e) => { 
                        var data = new Uint8Array(e.target.result);
                        var workbook = XLSX.read(data, { type: 'array' });
                        var sheetName = workbook.SheetNames[0];
                        var worksheet = workbook.Sheets[sheetName];
        
                       
                        var jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
                        
                        if (jsonData.length > 0) {
                            var columnNames = jsonData[0]; // Cabeçalhos das colunas
                            var dataRows = jsonData.slice(1); // Dados das linhas
        
                            dataRows.forEach((row, rowIndex) => {
                                if (row[0] != undefined && row[0] != null) {
                                    var element = oView.byId("inputCep");
                                    element.setValue(row[0]);
                                    this.onBuscarCep(); 
                                    element.setValue();
                                }
                               
                                MessageToast.show("Dados lidos com sucesso!");
                            });
                        } else {
                            console.log("A planilha está vazia.");
                        }
                   
                    };
                    reader.readAsArrayBuffer(file);
              
                }
            });
        
            fileInput.click();
            fileInput.parentNode.removeChild(fileInput);
         
        },

        onItemSelect: function(oEvent) {
            var sKey = oEvent.getParameter("item").getKey();
            this.byId("navigationList").setSelectedKey(sKey);
            switch (sKey) {
                case "home":
                    this.getOwnerComponent().getRouter().navTo("BuscaCep");
                    break;
                case "newTable":
                    this.getOwnerComponent().getRouter().navTo("NewTable");
                    break;
               
            }
        }
    });
});
