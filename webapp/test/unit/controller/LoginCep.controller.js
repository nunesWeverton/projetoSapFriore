/*global QUnit*/

sap.ui.define([
	"login-cep/controller/LoginCep.controller"
], function (Controller) {
	"use strict";

	QUnit.module("LoginCep Controller");

	QUnit.test("I should test the LoginCep controller", function (assert) {
		var oAppController = new Controller();
		oAppController.onInit();
		assert.ok(oAppController);
	});

});
