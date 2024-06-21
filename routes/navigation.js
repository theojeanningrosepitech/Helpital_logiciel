/**
 * @module navigation
 */

/**
 * Return a navigation object, to use with header.pug
 * @param {Http.Request} req - Http request object
 * @param {Routes} targetRoute - Targeted route
 * @param {string} targetName - Value to replace the $name substring
 * @param {string} query - Value to replace the $query substring
 */
function Get(req, targetRoute, targetName = '', query = '') {
    let levels = [];

    if ( !targetRoute || targetRoute === undefined || targetRoute == null) {
        return levels;
    }
    // search for the route
    let route = getRouteCopy(targetRoute);

    // route not found
    if (route == null)
        return levels;

    levels = recursiveRouteExtraction(levels, route);

    // set special links
    if (levels.length > 0 && levels[0].link === '')
        levels[0].link = req.originalUrl;

    // set target name
    // set query extra data
    // hide extra links
    for (const i in levels) {
        for (const j in levels[i].list) {

            if (levels[i].list[j].name.indexOf('$name') !== -1 && (targetName === '' || i != 0))
                levels[i].list[j].hide = true
            else if (targetName !== '' && levels[i].list[j].name.indexOf('$name') !== -1)
                levels[i].list[j].name = levels[i].list[j].name.replace('$name', targetName);

            if (query !== '')
                levels[i].list[j].link = levels[i].list[j].link.replace('$query', query);
        }

        if (targetName !== '')
            levels[i].name = levels[i].name.replace('$name', targetName);
        if (query !== '')
            levels[i].link = levels[i].link.replace('$query', query);
    }

    return levels.reverse();
}

/**
 * Return a deep copy/clone of the targeted route.
 * @param {Routes} targetRoute - Targeted route
 */
function getRouteCopy(targetRoute) {
    let routes = new Routes();

    for (const key in routes) {
        if (routes[key].name === targetRoute.name && routes[key].link === targetRoute.link && routes[key].sub.length === targetRoute.sub.length) {
            return routes[key];
        }

        for (const lvl2 in routes[key].sub) {
            if (routes[key].sub[lvl2].name === targetRoute.name && routes[key].sub[lvl2].link === targetRoute.link && routes[key].sub[lvl2].sub.length === targetRoute.sub.length) {
                return routes[key].sub[lvl2];
            }

            for (const lvl3 in routes[key].sub[lvl2].sub) {
                if (routes[key].sub[lvl2].sub[lvl3].name === targetRoute.name && routes[key].sub[lvl2].sub[lvl3].link === targetRoute.link && routes[key].sub[lvl2].sub[lvl3].sub.length === targetRoute.sub.length) {
                    return routes[key].sub[lvl2].sub[lvl3];
                }

                for (const lvl4 in routes[key].sub[lvl2].sub[lvl3].sub) {
                    if (routes[key].sub[lvl2].sub[lvl3].sub[lvl4].name === targetRoute.name && routes[key].sub[lvl2].sub[lvl3].sub[lvl4].link === targetRoute.link && routes[key].sub[lvl2].sub[lvl3].sub[lvl4].sub.length === targetRoute.sub.length) {
                        return routes[key].sub[lvl2].sub[lvl3].sub[lvl4];
                    }
                }
            }
        }
    }

    return null;
}

/**
 * Return and fill a complete navigation path
 * @param {array} array - Paths to fill
 * @param {Routes} route - Targeted route
 */
function recursiveRouteExtraction(array, route) {
    let obj = route;

    if (route.root) {
        obj.list = [];

        for (const key in route.root)
            if (key !== 'init') {
                obj.list.push(route.root[key]);

                if (route.root[key] == route) {
                    route.root[key].selected = true;
                }
            }
    } else if (route.parent) {
        obj.list = [];

        for (const key in route.parent.sub)
            if (key !== 'init') {
                obj.list.push(route.parent.sub[key]);

                if (route.parent.sub[key] == route)
                    route.parent.sub[key].selected = true;
            }
    }
    array.push(obj);

    if (route.parent)
        array = recursiveRouteExtraction(array, route.parent);

    return array;
}

/**
 * Set a parent object for every children (subroutes)
*/
function initChildren() {
    for (const key in this.sub)
        this.sub[key].parent = this;
    delete this.init;

    return this;
}

/**
 * Set a root variable for every objects in {obj}
 * @param {object} obj - Navigation path fragment
*/
function initRoot(obj) {
    for (const key in obj)
        obj[key].root = obj;

    return this;
}

/**
 * Class variable containing all possible routes and subroutes of the project.
*/
const Routes = class {
    constructor() {
        this.directory = {
            name: 'Annuaire',
            link: '/directory',
            sub: {}
        };

        this.roomManagement = {
            name: 'Chambres',
            link: '/room_management',
            sub: {}
        };

        this.cloud = {
            name: 'Cloud',
            link: '/cloud',
            sub: {
                cloud: {
                    name: 'Cloud',
                    link: '/cloud',
                    sub: {}
                },
                shared: {
                    name: 'Partagés avec moi',
                    link: '/cloud/shared',
                    sub: {}
                },
                recent: {
                    name: 'Récents',
                    link: '/cloud/recent',
                    sub: {}
                },
                favorites: {
                    name: 'Favoris',
                    link: '/cloud/favorites',
                    sub: {}
                },
            },
            init: initChildren
        }.init();

        this.equipe = {
            name: 'Mon équipe',
            link: '/equipe',
            sub: {}
        };

        this.backOffice = {
            name: 'Gestion',
            link: '/back_office',
            sub: {
                contract_inavailability: {
                    name: 'Contrat et indisponibilité',
                    link: '/back_office/contract_inavailability',
                    sub: {}
                },
                users: {
                    name: 'Gestion des comptes',
                    link: '/back_office/users',
                    sub: {}
                },
                interim: {
                    name: 'Intérimaire',
                    link: '/back_office/interim',
                    sub: {}
                },
                contract: {
                    name: 'Contrat',
                    link: '/back_office/contract',
                    sub: {}
                },
                insult: {
                    name: 'Les mots à filtrer',
                    link: '/back_office/insult',
                    sub: {}
                },
                services: {
                    name: 'Services',
                    link: '/back_office/services',
                    sub: {
                        service: {
                            name: '$name',
                            link: '/back_office/service?id_service=$query',
                            sub: {}
                        },
                    },
                    init: initChildren
                }.init(),
                inventory: {
                    name: 'Inventaire',
                    link: '/back_office/inventory',
                    sub: {
                        inventory: {
                            name: '$name',
                            link: '/inventory?id=$query',
                            //link: '/back_office/inventory?id=$query',
                            sub: {}
                        },
                        edit: {
                            name: 'Modifier - $name',
                            link: '/back_office/inventory/edit?id=$query',
                            sub: {}
                        },
                        new: {
                            name: 'Nouveau',
                            link: '/back_office/inventory/new',
                            sub: {}
                        },
                        types: {
                            name: 'Catégories',
                            link: '/back_office/inventory/types',
                            sub: {
                                type: {
                                    name: '$name',
                                    link: '/back_office/inventory/type?id=$query',
                                    sub: {}
                                },

                                edit: {
                                    name: 'Modifier - $name',
                                    link: '/back_office/inventory/types/edit?id=$query',
                                    sub: {}
                                },

                                new: {
                                    name: 'Nouveau',
                                    link: '/back_office/inventory/types/new',
                                    sub: {}
                                },
                            },
                            init: initChildren
                        }.init(),
                    },
                    init: initChildren
                }.init(),

                repair: {
                    name: 'Réparations',
                    // link: '/back_office/repair 2',
                    link: '/back_office/repairs',
                    sub: {}
                },
                rooms: {
                    name: 'Salles',
                    link: '/room_management',
                    sub: {
                        room: {
                            name: '$name',
                            link: '/rooms?id=$query',
                            sub: {}
                        },

                        edit: {
                            name: 'Modifier - $name',
                            link: '/rooms/edit?id=$query',
                            sub: {}
                        },

                    /*    new: {
                            name: 'Nouveau',
                            link: '/rooms/new',
                            sub: {}
                        },
*/
                        types: {
                            name: 'Catégories',
                            link: '/rooms/types',
                            sub: {

                                type: {
                                    name: '$name',
                                    link: '/rooms/types/type?id=$query',
                                    sub: {}
                                },

                                edit: {
                                    name: 'Modifier - $name',
                                    link: '/rooms/types/edit?id=$query',
                                    sub: {}
                                },

                                new: {
                                    name: 'Nouveau',
                                    link: '/rooms/types/new',
                                    sub: {}
                                },
                            },
                            init: initChildren
                        }.init(),
                    },
                    init: initChildren
                }.init(),
                admin: {
                    name: 'Système',
                    link: '/back_office/admin',
                    sub: {}
                },
            },
            init: initChildren
        }.init();

        this.inventory = {
            name: 'Inventaire',
            link: '/inventory',
            sub: {
                inventory: {
                    name: '$name',
                    link: '/inventory?id=$query',
                    sub: {}
                },
            },
            init: initChildren
        }.init();

        this.messages = {
            name: 'Messagerie',
            link: '/messaging', // /conversation?user_id=3
            sub: {}
        };
/*    messages2: {
        name: 'Messagerie 2',
        link: '/messaging',
        sub: {}
    },*/

        // this.note = {
        //     name: 'Note',
        //     link: '/note',
        //     sub: {}
        // };

        // this.prescription = {
        //     name: 'Ordonnances',
        //     link: '/prescription',
        //     sub: {}
        // };

        this.patients = {
            name: 'Capsule patient',
            link: '/patients',
            sub: {}
        };

        this.plan = {
            name: 'Plan',
            link: '/plan',
            sub: {}
        };

        this.planning = {
            name: 'Planning',
            link: '/planning',
            sub: {}
        };

        this.preferences = {
            name: 'Préférences',
            link: '/preferences',
            sub: {}
        };

        this.profil = {
            name: 'Profil',
            link: '/profil',
            sub: {}
        };

        this.xray = {
            name: 'Radiographies',
            link: '/xrays',
            sub: {}
        };

        this.reception = {
            name: 'Réception',
            link: '/reception',
            sub: {}
        };

        this.waiting = {
            name: 'Salle d\'attente',
            link: '/waiting',
            sub: {}
        };

        this.statistics = {
            name: 'Statistiques',
            link: '/statistics',
            sub: {}
        };

        this.emergency = {
            name: 'Urgence',
            link: '/emergency',
            sub: {
                doctors: {
                    name: 'Docteur',
                    link: '/doctors',
                    sub: {}
                },
                nurses: {
                    name: 'Infirmiers',
                    link: '/nurses',
                    sub: {}
                },
            },
            init: initChildren
        }.init();

        initRoot(this);
    }
};

module.exports = {
    Get: Get,
    routes: new Routes()
}
