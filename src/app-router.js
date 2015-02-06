<link rel="import" href="../../components/app-router/src/app-router.html">
<link rel="import" href="../../layout-components/loading/loading.html">

<polymer-element name="ll-router">
    <template>
        <style-less>
            :host {
                position: relative;
            }

            app-route {
                display: none;
            }

            app-router, #loading, app-route[active] {
                .trbl-fit();
                display: block;
            }

            app-route[active] > * {
                .trbl-fit();
                display: block;
                background-color: @pageColor;
            }
        </style-less>

        <!-- Show a background during page load time -->
        <ll-loading id="loading">
            <div></div>
        </ll-loading>


        <app-router id="router" trailingSlash="ignore" init="manual">
            <template repeat="{{ route in routes }}">
                <app-route path="/{{ route.target }}"
                           import="{{ route.page }}"></app-route>
            </template>
            <app-route path="/dashboard"
                       import="sections/dashboard/page-dashboard.html"></app-route>
            <app-route path="/features"
                       import="sections/features/page-features.html"></app-route>
            <app-route path="/error"
                       import="sections/page-error.html"></app-route>
            <app-route path="*"
                       import="sections/dashboard/page-dashboard.html"></app-route>
        </app-router>
    </template>
    <script>
        "use strict";
        Polymer(WebComponents.mixin({
            routes: window.all_routes,
            ready: function () {
                this.$.loading.loading = true;

                window.Router = window.Router || function (routerObject) {
                    return {
                        router: function () {
                            return routerObject;
                        },
                        go: function (path) {
                            //Forcefully delete roots
                            var currentRoots = this.listCurrentPages();
                            if (currentRoots.length > 0) {
                                if (currentRoots.length > 1) {
                                    warnPopup({
                                        content: "Leaked some roots"
                                    });
                                }
                            }
                            for (var i = 0; i < currentRoots.length; i++) {
                                try {
                                    currentRoots[i].parentElement.removeChild(currentRoots[i]);
                                } catch (e) {
                                    warnPopup({
                                        content: "Could not delete root"
                                    });
                                }
                            }

                            //Change the page
                            this.router().go(path);

                            //Fix jQuery leak
                            jQuery.caches.data_priv.expando = jQuery.expando + Math.random();
                            Object.defineProperty(jQuery.caches.data_priv.cache = {}, 0, {
                                get: function () {
                                    return {};
                                }
                            });
                            jQuery.caches.data_user.expando = jQuery.expando + Math.random();
                            Object.defineProperty(jQuery.caches.data_user.cache = {}, 0, {
                                get: function () {
                                    return {};
                                }
                            });

                            setTimeout(
                                    this.checkPageLoaded(this),
                                    10000
                            );
                        },
                        listCurrentPages: function () {
                            return document.querySelectorAll("* /deep/ app-route > *");
                        },
                        checkPageLoaded: function () {
                            var element = this;
                            return function () {
                                if (element.listCurrentPages().length != 1) {
                                    warnPopup({
                                        content: "Either this page is really slow, or it failed to load properly."
                                    });
                                }
                            };
                        },
                        onChange: function (action) {
                            this.router().addEventListener(
                                    'state-change',
                                    function (event) {
                                        var linkName = event.detail.path.slice(1);
                                        action(linkName);
                                    }
                            );
                        },
                        init: function () {
                            this.router().init();
                        },
                        refresh: function () {
                            this.go(window.location.hash.substr(1));
                        },
                        queryParameters: function () {
                            var queryDict = {};
                            location.search.substr(1).split("&").forEach(function (item) {
                                queryDict[item.split("=")[0]] = item.split("=")[1];
                            });
                            return queryDict;
                        },
                        hasFlag: function (flagName) {
                            var v = this.queryParameters();
                            return v.hasOwnProperty(flagName);
                        }
                    };
                }(this.$.router);
            }
        }, shared_mixins));
    </script>
</polymer-element>
