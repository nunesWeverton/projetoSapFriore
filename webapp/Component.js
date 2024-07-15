// Component.js

sap.ui.define([
    "sap/ui/core/UIComponent"
], function(UIComponent) {
    "use strict";

    return UIComponent.extend("logincep1.Component", {
        metadata: {
            manifest: "json"
        },

        init: function() {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
            this.getRouter().attachRouteMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");
            
            // Check if user is authenticated
            var userId = localStorage.getItem("localId");


            console.log(sRouteName)
            console.log(userId)
            if (userId === null && sRouteName !== "LoginCep" && sRouteName !== "Register") {
                this.getRouter().navTo("RouteLoginCep", {}, true);
            }
        },

        // Método para configurar a rota padrão após o login
        _setInitialRoute: function() {
            var oRouter = this.getRouter();
            oRouter.getRoute("RouteLoginCep").attachPatternMatched(this._onLoginMatched, this);
        },

        // Lógica para exibir o menu fixo após o login
        _onLoginMatched: function() {
            var oMenuController = this.getRootControl().getController(); // Assumindo que o controller do menu está no root view
            oMenuController.showMenu(); // Método fictício para exibir o menu
        }
    });
});
