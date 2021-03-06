/**
 * @author Umed Khudoiberdiev <info@zar.tj>
 */
(function() {
    'use strict';

    /**
     * @ngdoc directive
     * @name selectAutocomplete
     * @restrict E
     * @description
     * This directive allows to select items from the dropdown to fill the given model with the data provided by dropdown.
     *
     * @param {expression} ngModel Model that will be changed
     * @param {expression} onChange Expression to be evaluated when model is changed
     * @param {expression} selectOptions Options to be parsed and used for items data source and other options
     * @param {string} nothingSelectedLabel Decorator function that can wrap or change how item will be shown in the items box
     * @param {string} selectedItemsSeparator Separator character used between items
     * @param {number} selectedItemsShowLimit Maximal number of items to be shown in the box
     * @param {boolean} disabled If set to true then all interactions with the component will be disabled
     * @param {boolean} multiselect If set to true then user can select multiple options from the list of items. In this
     *                              case ng-model will be an array. If set to false then user can select only one option
     *                              from the list of items. In this case ng-model will not be array
     * @param {number} dropdownShowLimit Maximal number of items to show in the dropdown
     * @param {boolean} search If set to true, then search input will be shown to the user, where he can peform a search
     *                          in the list of items
     * @param {Function} searchFilter Filter that controls the result of the search input
     * @param {expression|object} searchKeyword Model used to be a search keyword that user types in the search box
     * @param {boolean} autoSelect If set to true, then first item of the give select-items will be selected.
     *                             This works only with single select
     * @param {boolean} selectAll If set to true, then "select all" option will be shown to user. This works only when
     *                              multiple items mode is enabled
     * @param {boolean} groupSelectAll If set to true, then "select all" option will be shown to user. This works only
     *                                  when item groups are enabled
     * @param {boolean} hideControls If set to true, then all select-items controls will be hidden. Controls such as
     *                               checkboxes and radio boxes
     * @param {boolean} hideNoSelection If set to true, then all "nothing is selected" label and checkbox will not be
     *                                      shown. This label show only in single select mode
     * @param {string} searchPlaceholder Custom placeholder text that will be in the search box
     * @param {string} selectAllLabel Custom text that will be used as a "select all" label.
     *                                  This label show only in single select mode
     * @param {string} deselectAllLabel Custom text that will be used as a "deselect all" label.
     *                                  This label show only in multi select mode
     * @param {string} noSelectionLabel Custom text that will be used as a "no items selected" label.
     *                                  This label show only in multiselect mode.
     * @param {string} loadingLabel Custom text that will be used to show a message when items are loaded for the first
     *                              time. This works only if loadPromise is given.
     * @param {Function} loadPromise A callback that makes some job (for example $http request) and gets the data to show
     *                              in the items list right after component initialization. Callback must return promise
     *                              that contains a valid data for the select items.
     * @param {Function} loadByKeywordPromise A callback that makes some job (for example $http request) and gets the data
     *                                      to show in the items list when search keyword is changed.
     *                                      Callback must return promise that contains a valid data for the select items.
     * @param {number} loadByKeywordDelay A delay time (in milliseconds) before a loadByKeywordPromise will run
     * @param {number} loadByKeywordMinQueryLength Minimal search keyword query length to make loadByKeywordPromise to run.
     * @param {Array.<Function>} filters Filters used to filter out values that must not be shown.
     * @param {Function} dropdownItemDecorator Custom decorator used to change a view of the list item
     * @param {Function} dropdownGroupDecorator Custom decorator used to change a view of the list item group
     * @param {boolean} lazyLoad Indicates if loading items into the dropdown should be done only by a first click on it
     */
    angular.module('selectAutocomplete').directive('selectAutocomplete', selectAutocomplete);

    /**
     * @ngInject
     */
    function selectAutocomplete($parse, $timeout) {
        return {
            replace: true,
            restrict: 'E',
            require: ['^ngModel', '^selectOptions'],
            template: function(element, attrs) {
                var id = 'select_autocomplete_' + s4() + '_' + s4() + '_' + s4();
                var html = element.html().trim();

                return ['<div class="select-autocomplete" ng-class="{ \'disabled\': ' + id + '.isDisabled }" data-id="' + id + '">',
                    '<input id="' + id + '" style="display: block"',
                            attrs.placeholder ? 'placeholder="' + attrs.placeholder + '"' : '',
                            'class="select-autocomplete-input"',
                            'ng-model="' + id + '.userInputText"',
                            'ng-change="' + id + '.change()"',
                            'ng-class="{\'opened\': ' + id + '.isOpened, \'closed\': !' + id + '.isOpened}">',
                    '<open-dropdown class="open-dropdown" ',
                                    'disabled="' + attrs.disabled + '"',
                                    'tabindex="3" ',
                                    'fit-width-to-attached-container="true"',
                                    'for="' + id + '" ',
                                    'is-opened="' + id + '.isOpened">',
                       '<select-items class="select-items"',
                            'multiselect="false"',
                            'hide-no-selection="true"',
                            'hide-controls="true"',
                            'search-keyword="' +  id + '.userInputText"',
                            'select-options="' + attrs.selectOptions + '"',
                            'ng-model="' + attrs.ngModel + '"',
                            attrs.onChange ? 'on-change="' + attrs.onChange + '"' : '',
                            attrs.dropdownShowLimit ? 'show-limit="' + attrs.dropdownShowLimit + '"' : '',
                            attrs.search ? 'search="' + attrs.search + '"' : '',
                            attrs.searchFilter ? 'search-filter="' + attrs.searchFilter + '"' : '',
                            attrs.autoSelect ? 'auto-select="' + attrs.autoSelect + '"' : '',
                            attrs.selectAll ? 'select-all="' + attrs.selectAll + '"' : '',
                            attrs.groupSelectAll ? 'group-select-all="' + attrs.groupSelectAll + '"' : '',
                            attrs.searchPlaceholder ? 'search-placeholder="' + attrs.searchPlaceholder + '"' : '',
                            attrs.selectAllLabel ? 'select-all-label="' + attrs.selectAllLabel + '"' : '',
                            attrs.deselectAllLabel ? 'deselect-all-label="' + attrs.deselectAllLabel + '"' : '',
                            attrs.noSelectionLabel ? 'no-selection-label="' + attrs.noSelectionLabel + '"' : '',
                            attrs.loadingLabel ? 'loading-label="' + attrs.loadingLabel + '"' : '',
                            attrs.loadPromise ? 'load-promise="(' + id + '.isOpenedForFirstTime || !' + attrs.lazyLoad + ') ? ' + attrs.loadPromise + ' : null "' : '',
                            attrs.loadByKeywordPromise ? 'load-by-keyword-promise="' + attrs.loadByKeywordPromise + '"' : '',
                            attrs.loadByKeywordDelay ? 'load-by-keyword-delay="' + attrs.loadByKeywordDelay + '"' : '',
                            attrs.loadByKeywordMinQueryLength ? 'load-by-keyword-min-query-length="' + attrs.loadByKeywordMinQueryLength + '"' : '',
                            attrs.filters ? 'filters="' + attrs.filters + '"' : '',
                            attrs.dropdownItemDecorator ? 'decorator="' + attrs.dropdownItemDecorator + '"' : '',
                            attrs.dropdownGroupDecorator ? 'group-decorator="' + attrs.dropdownGroupDecorator + '"' : '',
                    '>' + html + '</select-items></open-dropdown></div>'].join('');
            },
            link: function(scope, element, attrs, controllers) {

                // ---------------------------------------------------------------------
                // Variables
                // ---------------------------------------------------------------------

                var ngModelCtrl       = controllers[0];
                var selectOptionsCtrl = controllers[1];
                var id = angular.element(element).attr('data-id');
                scope[id] = {
                    userInputText: '',
                    isOpened: false,
                    isOpenedForFirstTime: false,
                    isDisabled: $parse(attrs.disabled)(scope)
                };

                var selectItemsElement = element[0].getElementsByClassName('select-items')[0];
                var selectItemsElementCtrl = angular.element(selectItemsElement).controller('selectItems');

                // ---------------------------------------------------------------------
                // Local functions
                // ---------------------------------------------------------------------

                /**
                 * Checks if open dropdown is disabled or not.
                 *
                 * @returns {boolean}
                 */
                var isDisabled = function() {
                    return attrs.disabled ? $parse(attrs.disabled)(scope) : false;
                };

                /**
                 * Listen to key downs to control drop down open state.
                 *
                 * @param {KeyboardEvent} e
                 */
                var onSelectDropdownKeydown = function(e) {
                    if (isDisabled()) return;

                    switch (e.keyCode) {

                        case 38: // KEY "UP"
                            e.preventDefault();
                            scope[id].isOpened = true;
                            scope.$broadcast('select-items.active_next');
                            break;

                        case 40: // KEY "DOWN"
                            e.preventDefault();
                            scope.$broadcast('select-items.active_previous');
                            break;

                        case 13: // KEY "ENTER"
                            if (scope[id].isOpened) {
                                var isItemSelected = selectItemsElementCtrl.selectActive();

                                // if item was selected from the item list then we stop propagation to prevent
                                // tags-input to add a new tag (tag with user's entered value)
                                if (isItemSelected === true) {
                                    e.stopPropagation();
                                    scope[id].isOpened = false;  // after item is selected automatically close dropdown
                                    scope.$digest();
                                    return;
                                }
                            }
                            break;

                        case 27: // KEY "ESC"
                            scope[id].isOpened = false;
                            scope.$digest();
                            return;
                    }

                    scope[id].isOpened = true;
                    scope.$digest();
                };

                // ---------------------------------------------------------------------
                // Scope functions
                // ---------------------------------------------------------------------

                /**
                 * Gets the item name that will be used to display in the list.
                 *
                 * @param item
                 * @returns {string}
                 */
                scope.getItemName = function(item) {
                    var value = selectOptionsCtrl.parseItemValueFromSelection(item);
                    return scope.decorator ? scope.decorator(item) : value;
                };

                // ---------------------------------------------------------------------
                // Event Listeners
                // ---------------------------------------------------------------------

                scope.$watch(attrs.disabled, function(disabled) {
                    scope[id].isDisabled = disabled;
                });

                scope.$watch(id + '.isOpened', function(isOpened) {
                    if (scope[id].isOpenedForFirstTime === false && isOpened === true)
                        scope[id].isOpenedForFirstTime = true;
                });

                element[0].addEventListener('keydown', onSelectDropdownKeydown);

                // when new item selected in the select-items we need to set a select ngModel
                scope.$on('select-items.item_selected', function(event, data) {
                    if (data.element !== selectItemsElement)
                        return;

                    scope[id].userInputText = scope.getItemName(data.item);
                    scope[id].isOpened = false;
                });

                scope[id].change = function() {
                    var model = selectOptionsCtrl.createItem(scope[id].userInputText);
                    ngModelCtrl.$setViewValue(model);
                    if (attrs.onChange) {
                        $timeout(function() {
                            selectOptionsCtrl.applyOnScope(attrs.onChange);
                        });
                    }
                };

                scope.$watch(function() {
                    return ngModelCtrl.$modelValue;
                }, function(model) {
                    if (model)
                        scope[id].userInputText = scope.getItemName(model);
                });
            }
        };
    }

    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

})();