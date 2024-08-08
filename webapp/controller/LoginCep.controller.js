sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
function (Controller, MessageToast) {
    "use strict";
    var sUrl = 'https://api-btp-new.azurewebsites.net/api';

    return Controller.extend("sap.btp.logincep.controller.LoginCep", {

        OnLogin: function () {
         MessageToast.show("Login bem-sucedido.");
                        that.getOwnerComponent().getRouter().navTo("BuscaCep");
                  
        },

        onKeyPress: function (oEvent) {
            if (oEvent.which === 13) { // 13 é o código da tecla Enter
                this.OnLogin();
            }
        },

        onRegister: function() {
            this.getOwnerComponent().getRouter().navTo("BuscaCep");
        }
    });
});