
sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
],
function (Controller, MessageToast) {
    "use strict";

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
            firebase.auth().signInWithEmailAndPassword(sUsername, sPassword)
                .then((userCredential) => {
                    var user = userCredential.user;
                    MessageToast.show("Login successful!");
                    that.getOwnerComponent().getRouter().navTo("BuscaCep");               
                })
                .catch((error) => {
                    // Erro no login
                    var errorMessage = error.message;
                    MessageToast.show("Login failed: " + errorMessage);
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