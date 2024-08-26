sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
],
function (Controller, MessageToast) {
  "use strict";
  var sUrl = 'https://api-btp-dev.azurewebsites.net/api';

  return Controller.extend("sap.btp.logincep.controller.NewTable", {

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