sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast"
], function (Controller, MessageToast) {
    "use strict";

    return Controller.extend("sap.btp.logincep.controller.Register", {
        onInit: function () {
            const firebaseConfig = {
                apiKey: "AIzaSyB6boGZ2If59Hf26nkP_avdoL719q8hfMc",
                authDomain: "teste-ax-sap.firebaseapp.com",
                projectId: "teste-ax-sap",
                storageBucket: "teste-ax-sap.appspot.com",
                messagingSenderId: "948945281434",
                appId: "1:948945281434:web:276a62fd256fcdf2679a23",
                measurementId: "G-PLGST4XQ2F"
            };

            // Inicializa o Firebase apenas uma vez
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
            } else {
                firebase.app(); // Use a aplicação existente
            }

            // Inicializa o Firestore
            this.db = firebase.firestore();
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

            firebase.auth().createUserWithEmailAndPassword(sEmail, sPassword)
                .then((userCredential) => {
                    var user = userCredential.user;

                    // Armazenar informações adicionais no Firestore
                    return this.db.collection('users').doc(user.uid).set({
                        firstName: sFirstName,
                        lastName: sLastName,
                        email: sEmail,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                })
                .then(() => {
                    MessageToast.show("Cadastro realizado com sucesso!");
                    this.getOwnerComponent().getRouter().navTo("RouteLoginCep");
                })
                .catch((error) => {
                    var errorMessage = error.message;
                    MessageToast.show("Falha no cadastro: " + errorMessage);
                });
        },

        onGoToLogin: function() {
            this.getOwnerComponent().getRouter().navTo("RouteLoginCep");
        }
    });
});