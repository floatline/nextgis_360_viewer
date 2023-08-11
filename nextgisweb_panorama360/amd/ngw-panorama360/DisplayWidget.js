define([
    "dojo/_base/declare",
    "@nextgisweb/pyramid/i18n!",
    "@nextgisweb/pyramid/api",
    "ngw-feature-layer/DisplayWidget",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/panorama360/panorama360-display",
    "@nextgisweb/pyramid/settings!webmap"
], function (
    declare,
    i18n,
    api,
    DisplayWidget,
    reactApp,
    Panorama360Display,
    webmapSettings
) {
    return declare([DisplayWidget], {

        title: i18n.gettext("Panorama360"),

        buildRendering: function () {
            this.inherited(arguments);
        },

        // featureFields value comes from extension.py file
        renderValue: function (params) {
            var layerId  = params[0];
            var featureId = params[1];
            var featureFields = params[2];
            console.log(layerId, featureId, featureFields);
            var webmapId = this.webmapId;
            return api.route("resource.item", {
                id: webmapId
            }).get({
                cache: true
            }).then((res) => {
                var settings = res.panorama360_settings;
                var enabled = settings.enabled;
                var panoramaLayerField = settings.panorama_layer_field
                if (!enabled) {
                    return false;
                };
                var url = featureFields[panoramaLayerField];
                if (!this.isValidUrl(url)) {
                    return false;
                };
                this.inherited(arguments);
                this.component = reactApp.default(
                    Panorama360Display.default,
                    {
                        url: url,
                        featureId: featureId,
                        layerId: layerId,
                        panoramaField: panoramaLayerField
                    },
                    this.domNode
                );
                return true;
            });


        },
        isValidUrl: function (url) {
            var pattern = new RegExp(/^(https?:\/\/)?([\w.\-]+)\.([a-z]{2,})(\/[\w.\-%]*)*\/?$/i);
            return pattern.test(url);

        },

    });
})