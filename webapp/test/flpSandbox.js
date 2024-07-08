sap.ui.define([
	"sap/base/util/ObjectPath",
	"sap/ushell/services/Container"
], function (ObjectPath) {
	"use strict";

	// define ushell config
	ObjectPath.set(["sap-ushell-config"], {
		defaultRenderer: "fiori2",
		bootstrapPlugins: {
			"RuntimeAuthoringPlugin": {
				component: "sap.ushell.plugins.rta",
				config: {
					validateAppVersion: false
				}
			},
			"PersonalizePlugin": {
				component: "sap.ushell.plugins.rta-personalize",
				config: {
					validateAppVersion: false
				}
			}
		},
		renderers: {
			fiori2: {
				componentData: {
					config: {
						enableSearch: false,
						rootIntent: "Shell-home"
					}
				}
			}
		},
		services: {
			"LaunchPage": {
				"adapter": {
					"config": {
						"groups": [{
							"tiles": [{
								"tileType": "sap.ushell.ui.tile.StaticTile",
								"properties": {
<<<<<<< HEAD
									"title": "LoginCep",
									"targetURL": "#logincep-display"
=======
									"title": "Busca Cep",
									"targetURL": "#sapbtplogincep-display"
>>>>>>> dddca6cf065ca304ed76bec5ecf71942ba0d40eb
								}
							}]
						}]
					}
				}
			},
			"ClientSideTargetResolution": {
				"adapter": {
					"config": {
						"inbounds": {
<<<<<<< HEAD
							"logincep-display": {
								"semanticObject": "logincep",
								"action": "display",
								"description": "An SAP Fiori application.",
								"title": "LoginCep",
=======
							"sapbtplogincep-display": {
								"semanticObject": "sapbtplogincep",
								"action": "display",
								"description": "An SAP Fiori application.",
								"title": "Busca Cep",
>>>>>>> dddca6cf065ca304ed76bec5ecf71942ba0d40eb
								"signature": {
									"parameters": {}
								},
								"resolutionResult": {
									"applicationType": "SAPUI5",
<<<<<<< HEAD
									"additionalInformation": "SAPUI5.Component=logincep",
									"url": sap.ui.require.toUrl("logincep")
=======
									"additionalInformation": "SAPUI5.Component=sap.btp.logincep",
									"url": sap.ui.require.toUrl("sap/btp/logincep")
>>>>>>> dddca6cf065ca304ed76bec5ecf71942ba0d40eb
								}
							}
						}
					}
				}
			},
			NavTargetResolution: {
				config: {
					"enableClientSideTargetResolution": true
				}
			}
		}
	});

	var oFlpSandbox = {
		init: function () {
			/**
			 * Initializes the FLP sandbox
			 * @returns {Promise} a promise that is resolved when the sandbox bootstrap has finshed
			 */

			// sandbox is a singleton, so we can start it only once
			if (!this._oBootstrapFinished) {
				this._oBootstrapFinished = sap.ushell.bootstrap("local");
				this._oBootstrapFinished.then(function () {
					sap.ushell.Container.createRenderer().placeAt("content");
				});
			}

			return this._oBootstrapFinished;
		}
	};

	return oFlpSandbox;
});