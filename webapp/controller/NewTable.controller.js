sap.ui.define([
  "sap/ui/core/mvc/Controller",
  'sap/ui/model/odata/v2/ODataModel',
  'sap/ui/core/util/MockServer',
  'sap/ui/export/Spreadsheet',

], function(Controller, ODataModel, MockServer, Spreadsheet ) {
  "use strict";

  return Controller.extend("sap.btp.logincep.controller.NewTable", {

    onInit: function() {

      // this._bSortAscending  = true;
      // this._loadHistorico();

        sap.m.MessageBox.error = function() {
            // Não faz nada - a função foi sobrescrita para não exibir o pop-up
            console.log("Pop-up de erro desabilitado.");
        };

        var oMockServer = new MockServer({
            rootUri: "/localService/"
        });

        // Caminho para o arquivo metadata.xml e mockdata

        

        var sPath = sap.ui.require.toUrl("sap/btp/logincep/localService");

       
        oMockServer.simulate(sPath + "/metadata.xml", {
            sMockdataBaseUrl: sPath +  "/mockdata",
            bGenerateMissingMockData: true
        });


        oMockServer.start();

        // Cria o modelo OData com a URL do mock server
        var oModel = new ODataModel("/localService/", {
            defaultCountMode: "Inline"
        });
        // Associa o modelo à view
        this.getView().setModel(oModel);


        console.log("ODataModel configurado:", oModel);

    },


    // onBeforeExport: function(oEvent) {
    //     var oSmartTable = this.getView().byId("LineItemsSmartTable");
    //     var oTable = oSmartTable.getTable();
    //     var aSelectedItems = oTable.getSelectedItems(); // Obtém os itens selecionados da tabela
    //     var aSelectedData = []; // Array para armazenar os dados selecionados
    
    //     // Itera sobre os itens selecionados e armazena os dados no array
    //     aSelectedItems.forEach(function(oItem) {
    //         var oContext = oItem.getBindingContext(); // Obtém o contexto de binding do item selecionado
    //         var oData = oContext.getObject(); // Obtém o objeto de dados completo
    //         aSelectedData.push(oData); // Armazena os dados no array
    //     });
    
    //     if (aSelectedData.length === 0) {
    //         sap.m.MessageToast.show("Nenhuma linha selecionada para exportação.");
    //         oEvent.preventDefault(); // Cancela a exportação se nada estiver selecionado
    //         return;
    //     }
    
    //     // Cria um JSONModel temporário com os dados selecionados
    //     var oSelectedModel = new sap.ui.model.json.JSONModel();
    //     oSelectedModel.setData(aSelectedData); // Define diretamente os dados no modelo
    
    //     var oExportSettings = oEvent.getParameter("exportSettings");
    
    //     // Configura as configurações de exportação
    //     oExportSettings.dataSource = {
    //         type: 'json',
    //         data: oSelectedModel.getData() // Passa os dados diretamente para o JSON
    //     };
    //     oExportSettings.fileName = 'Line Items.xlsx';
    //     oExportSettings.fileType = 'XLSX';
    //     oExportSettings.showProgress = true;
    // },
    onBeforeExport: function (oEvent) {
        var oSmartTable = this.getView().byId("LineItemsSmartTable");
        var oTable = oSmartTable.getTable();
    
        // Verifica se a tabela existe
        if (!oTable) {
            sap.m.MessageToast.show("Tabela não encontrada.");
            oEvent.preventDefault();
            return;
        }
    
        // Verifica se há itens selecionados
        var aSelectedItems = oTable.getSelectedItems();
        var aData;
    
        if (aSelectedItems && aSelectedItems.length > 0) {
            
            aData = aSelectedItems.map(function (oItem) {
                return oItem.getBindingContext().getObject();
            });
        } else {
            
            var oBinding = oTable.getBinding("items");
            if (oBinding) {
                aData = oBinding.getContexts().map(function (oContext) {
                    return oContext.getObject();
                });
            }
        }
    
        console.log("Dados para exportação:", aData);  
    
        if (!aData || aData.length === 0) {
            sap.m.MessageToast.show("Nenhuma linha disponível para exportação.");
            oEvent.preventDefault();
            return;
        }
    
        
        var aColumns = [
            { label: 'Nome', property: 'Nome', type: 'string' },
            { label: 'Idade', property: 'Idade', type: 'number' },
            { label: 'Email', property: 'Email', type: 'string' },
            { label: 'Ativo', property: 'Ativo', type: 'boolean' }
        ];
    
        
        var oSettings = {
            workbook: { columns: aColumns },
            dataSource: aData,  
            fileName: 'SelectedItems.xlsx', 
            showProgress: true 
        };
    
       
        var oSheet = new sap.ui.export.Spreadsheet(oSettings);
        
        
        oSheet.build().then(function () {
            sap.m.MessageToast.show("Exportação concluída com sucesso.");
        }).catch(function (oError) {
             sap.m.MessageToast.show("Erro durante a exportação: ");
        }).finally(function () {
            oSheet.destroy();  
        });
    } ,


    
    

    // onBeforeExport: function(oEvent) {
    //     var oExportSettings = oEvent.getParameter("exportSettings");
    
    //     // Configuração de exportação
    //     oExportSettings.dataSource = {
    //         type: 'odata',
    //         dataUrl: 'http://localhost:8080/localService/mockdata/Persons.json?$format=json&$select=Nome,Idade,Email,Ativo',
    //         serviceUrl: '/localService'
    //     };
    //     oExportSettings.fileName = 'Line Items.xlsx';
    //     oExportSettings.fileType = 'XLSX';
    //     oExportSettings.showProgress = true;
    // },

  onDelete: function() {
    var oTable = this.byId("idTable");
    var aSelectedContexts = oTable.getSelectedContexts();

    if (aSelectedContexts.length === 0) {
        sap.m.MessageToast.show("Selecione pelo menos um item para deletar.");
        return;
    }

    aSelectedContexts.forEach(function(oContext) {
        var sPath = oContext.getPath();
        this.getView().getModel().remove(sPath, {
            success: function() {
                sap.m.MessageToast.show("Item deletado com sucesso!");
            },
            error: function() {
                sap.m.MessageToast.show("Falha ao deletar o item.");
            }
        });
    }.bind(this));
},
onAdd: function() {
    if (!this._oAddDialog) {
        this._oAddDialog = this.createAddDialog();
    }
    this._oAddDialog.open();
},

createAddDialog: function() {
    // Cria o diálogo
    var oDialog = new sap.m.Dialog({
        title: "Adicionar Item",
        contentWidth: "600px",
        content: [
            new sap.m.Label({
                text: "ID"
            }).addStyleClass("customLabel"),

            new sap.m.Input({
                id: "inputID",
                placeholder: "ID"
            }).addStyleClass("customInput"),

            new sap.m.Label({
                text: "Nome"
            }).addStyleClass("customLabel"),

            new sap.m.Input({
                id: "inputName",
                placeholder: "Nome"
            }).addStyleClass("customInput"),

            new sap.m.Label({
                text: "Idade"
            }).addStyleClass("customLabel"),

            new sap.m.Input({
                id: "inputAge",
                type: "Number",
                placeholder: "Idade"
            }).addStyleClass("customInput"),

            new sap.m.Label({
                text: "Email"
            }).addStyleClass("customLabel"),
            new sap.m.Input({
                id: "inputEmail",
                type: "Email",
                placeholder: "Email"
            }).addStyleClass("customInput"),

            new sap.m.Label({
                text: "Ativo"
            }).addStyleClass("customLabel"),

            new sap.m.CheckBox({
                id: "inputIsActive"
            }).addStyleClass("customInput checkBox")
        ],
        beginButton: new sap.m.Button({
            text: "Adicionar",
            press: function() {
                console.log("estou aqui ")
                this.onAddItem(); // Chama a função para adicionar o item
                oDialog.close(); // Fecha o diálogo
            }.bind(this)
        }).addStyleClass("buttonRoundBlue"),
        endButton: new sap.m.Button({
            text: "Cancelar",
            press: function() {
                oDialog.close(); // Fecha o diálogo
            }
        }).addStyleClass("buttonRoundBlue"),
    });


    // Anexa o diálogo ao controlador para reutilização
    this.getView().addDependent(oDialog);


    return oDialog;
},

onAddItem: function() {
    var oTable = this.byId("idTable");
    var oModel = oTable.getModel(); // Assumindo que é um ODataModel

    // Obtém os valores do diálogo
    var sID = sap.ui.getCore().byId("inputID").getValue();
    var sName = sap.ui.getCore().byId("inputName").getValue();
    var iAge = parseInt(sap.ui.getCore().byId("inputAge").getValue(), 10);
    var sEmail = sap.ui.getCore().byId("inputEmail").getValue();
    var bIsActive = sap.ui.getCore().byId("inputIsActive").getSelected();

    // Cria o novo item
    var oNewItem = {
        ID: sID,
        Nome: sName,
        Idade: iAge,
        Email: sEmail,
        Ativo: bIsActive
    };

    // Adiciona o novo item ao ODataModel
    oModel.create("/Persons", oNewItem, {
        success: function() {
            sap.m.MessageToast.show("Item adicionado com sucesso!",{
                duration: 1000, // duração da mensagem em milissegundos
                width: "20em", // largura da mensagem
                my: "center center", // posição da mensagem em relação ao viewport (meio da tela)
                at: "center center"  // onde a mensagem será posicionada
            });
             // Limpa os campos do diálogo
            sap.ui.getCore().byId("inputID").setValue("");
            sap.ui.getCore().byId("inputName").setValue("");
            sap.ui.getCore().byId("inputAge").setValue("");
            sap.ui.getCore().byId("inputEmail").setValue("");
            sap.ui.getCore().byId("inputIsActive").setSelected(false)
        },
        error: function() {
            sap.m.MessageToast.show("Erro ao adicionar o item.",{
                duration: 1000, // duração da mensagem em milissegundos
                width: "20em", // largura da mensagem
                my: "center center", // posição da mensagem em relação ao viewport (meio da tela)
                at: "center center"  // onde a mensagem será posicionada
            });
        }
    });
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