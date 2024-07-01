/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/Device",
    "sap/btp/logincep/model/models"
],
function (UIComponent, Device, models) {
    "use strict";

    return UIComponent.extend("sap.btp.logincep.Component", {
        metadata: {
            manifest: "json"
        },

        /**
         * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
         * @public
         * @override
         */
        init: function () {
            // call the base component's init function
            UIComponent.prototype.init.apply(this, arguments);

            // enable routing
            this.getRouter().initialize();

            // set the device model
            this.setModel(models.createDeviceModel(), "device");

            this.getRouter().attachRouteMatched(this._onRouteMatched, this);
        },
        
        _onRouteMatched: function (oEvent) {
            var sRouteName = oEvent.getParameter("name");

            // Check if user is authenticated
            var user = firebase.auth().currentUser;
            if (user == null && sRouteName !== "LoginCep" && sRouteName !== "Register") {
                this.getRouter().navTo("LoginCep", {}, true);
            }
        },

        // Método para configurar a rota padrão após o login
        _setInitialRoute: function() {
            var oRouter = this.getRouter();
            oRouter.getRoute("LoginCep").attachPatternMatched(this._onLoginMatched, this);
        },

        // Lógica para exibir o menu fixo após o login
        _onLoginMatched: function() {
            var oMenuController = this.getRootControl().getController(); // Assumindo que o controller do menu está no root view
            oMenuController.showMenu(); // Método fictício para exibir o menu
        }
    });
}
);