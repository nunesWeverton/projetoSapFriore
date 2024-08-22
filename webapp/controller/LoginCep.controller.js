sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
],
function (Controller, MessageToast) {
    "use strict";
    var sUrl = 'https://api-btp-dev.azurewebsites.net/api';

    return Controller.extend("sap.btp.logincep.controller.LoginCep", {

        OnLogin: function () {
            var oView = this.getView();
            var sUsername = oView.byId("_IDGenInput1").getValue();
            var sPassword = oView.byId("_IDGenInput2").getValue();
            
            if (sUsername === "" || sPassword === "") {
                MessageToast.show("Por favor entre com um usuário e uma senha");
                return;
            }

            var that = this; // Salva a referência do contexto atual
            $.ajax({
                url: sUrl+'/account/login',
                method: "POST",
                contentType: "application/json",
                data: JSON.stringify({
                    email: sUsername,
                    password: sPassword
                }),
                success: function(data) {
                    if (data.dadosToken) {
                        localStorage.setItem('user', data.dadosToken);
                        localStorage.setItem('idToken', data.dadosToken.idToken);
                        localStorage.setItem('email', data.dadosToken.email);
                        localStorage.setItem('refreshToken', data.dadosToken.refreshToken);
                        localStorage.setItem('expiresIn', data.dadosToken.expiresIn);
                        localStorage.setItem('localId', data.dadosToken.localId);
                        MessageToast.show("Login bem-sucedido.");
                        that.getOwnerComponent().getRouter().navTo("BuscaCep");
                        
                    } else {
                        MessageToast.show("Nome de usuário ou senha incorretos.");
                    }
                },
                error: function() {
                    MessageToast.show("Erro ao tentar fazer login.");
                }
            });
        },

        onKeyPress: function (oEvent) {
            if (oEvent.which === 13) { // 13 é o código da tecla Enter
                this.OnLogin();
            }
        },

        onRegister: function() {
            this.getOwnerComponent().getRouter().navTo("Register");
        }
    });
});