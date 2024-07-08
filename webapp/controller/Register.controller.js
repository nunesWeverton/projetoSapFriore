sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";
    var sUrl = 'https://api-btp.azurewebsites.net/api';

    return Controller.extend("logincep.controller.Register", {
        onInit: function () {
        
        },

        onCadastrar: function () {
            var oView = this.getView();
            var sFirstName = oView.byId("registerFirstName").getValue();
            var sLastName = oView.byId("registerLastName").getValue();
            var sEmail = oView.byId("registerEmail").getValue();
            var sPassword = oView.byId("registerPassword").getValue();

            if (sFirstName === "" || sLastName === "" || sEmail === "" || sPassword === "") {
                MessageToast.show("Por favor, preencha todos os campos.");
                return;
            }
            $.ajax({
                url: sUrl + '/user',
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    email: sEmail,
                    firstName: sFirstName,
                    lastName: sLastName,
                    password: sPassword
                }),
                success: (data) => {
                    MessageToast.show("Cadastro realizado com sucesso!");
                    this.getOwnerComponent().getRouter().navTo("LoginCep");
                },
                error: () => {
                    MessageToast.show("Erro ao tentar fazer registro.");
                }
            })
        },

        onGoToLogin: function() {
            this.getOwnerComponent().getRouter().navTo("LoginCep");
        }
    });
});