import { LightningElement, wire, track } from 'lwc';
import YG_CustomerPortal from "@salesforce/resourceUrl/YG_CustomerPortal";
import { NavigationMixin, CurrentPageReference } from 'lightning/navigation';
import { loadStyle, loadScript } from "lightning/platformResourceLoader";
import { fireEvent, registerListener, unregisterAllListeners, getCommURL, getQueryParams, getURLParameters } from 'c/pubSub';
import getCategories from "@salesforce/apex/YG_DocumentSearchController.getCategoryLevel1";
import getCategoryHierarchy from "@salesforce/apex/YG_DocumentSearchController.getCategoryHierarchy";
import getRecentlyUploadDownloads from "@salesforce/apex/YG_KB_Downloads.getRecentlyUploadDownloads";
import searchTechArt from "@salesforce/apex/YG_KB_TechnicalArticleController.searchTechArticle";
import getCategoryOfModel from "@salesforce/apex/YG_KB_Downloads.getCategoryOfModel";
import getPortalUserContact from '@salesforce/apex/YG_PortalFeedbackController.getPortalUserContact';
import nameLbl from '@salesforce/label/c.YG_Name';
import ProductTitleLbl from '@salesforce/label/c.YG_Product_Title';
import downloadTypeLbl from '@salesforce/label/c.YG_Download_Type';
import applicationModelLbl from '@salesforce/label/c.YG_Applicable_Model';
import revisionNoLbl from '@salesforce/label/c.YG_Revision_no';
import releaseDateLbl from '@salesforce/label/c.YG_Release_Date';
import viewAll from '@salesforce/label/c.YG_View_all';
import moreLbl from '@salesforce/label/c.YG_More';
import recentUpdateDownForYouLbl from '@salesforce/label/c.YG_updt_down_for_you';
import softwareLbl from '@salesforce/label/c.YG_Software';
import firmwareLbl from '@salesforce/label/c.YG_Firmware';
import driversLbl from '@salesforce/label/c.YG_Drivers';
import resetLbl from '@salesforce/label/c.YG_Reset';
import last5ResultsLbl from '@salesforce/label/c.YG_Last_5_Results';
import filterByProductsLbl from '@salesforce/label/c.YG_Filter_by_product_category';
import recentUptSWYouLbl from '@salesforce/label/c.YG_Recently_updated_software_for_you';
import recentUptFirmYouLbl from '@salesforce/label/c.YG_Recently_updated_Firmware_for_you';
import recentUptDriveYouLbl from '@salesforce/label/c.YG_Recently_updated_Drivers_for_you';
import noDataLbl from '@salesforce/label/c.YG_No_results_found_Please_try_another_search';
import allLbl from '@salesforce/label/c.YG_All';
import publishDate from '@salesforce/label/c.YG_LastPubDate';
import Installation_hardware from '@salesforce/label/c.YG_Installation_hardware';
import Installation_software from '@salesforce/label/c.YG_Installation_software';
import Specification from '@salesforce/label/c.YG_Specification';
import Calibration from '@salesforce/label/c.YG_Calibration';
import Technology from '@salesforce/label/c.YG_Technology';
import Repair from '@salesforce/label/c.YG_Repair_Physical_damage';
import Application from '@salesforce/label/c.YG_Application';
import Operation from '@salesforce/label/c.YG_Operation';
import ProductCategoryLbl from '@salesforce/label/c.YG_ProductCategory';



let communityURL, reachedModel = false, clickedViewAll = false;
export default class YgTechnicalArticle extends NavigationMixin(LightningElement) {

    @wire(CurrentPageReference) pageRef;
    SearchType = "";
    categories = [];
    softwareGrid = false;
    firmwareGrid = false;
    driversGrid = false;
    CalibrationsGrid = false;
    TechnologysGrid = false;
    Repair_Physical_damagesGrid = false;
    ApplicationsGrid = false;
    OperationsGrid = false;
    swloaded = false;
    searchGrid = false;
    searchQS = "";
    viewQS = "";
    model = "";
    @track Language;
    techData=[];
    @track categorizedResults = [];
    @track hasInstallationSoft = false;
    @track hasInstallationHard = false;
    @track hasSpecification = false;
    @track hasCalibration = false;
    @track hasTechnology = false;
    @track hasRepair = false;
    @track hasApplication = false;
    @track hasOperation = false;
    @track showErrorMsg = false;
    chkValue0 = true;
    chkValue1 = true;
    chkValue2 = true;
    chkValue3 = true;
    chkValue4 = true;
    chkValue5 = true;
    chkValue6 = true;
    chkValue7 = true;
    label = {
        nameLbl, downloadTypeLbl, applicationModelLbl, revisionNoLbl, releaseDateLbl, viewAll,
        recentUpdateDownForYouLbl, softwareLbl, firmwareLbl, driversLbl, resetLbl, last5ResultsLbl,
        filterByProductsLbl, recentUptSWYouLbl, recentUptFirmYouLbl, recentUptDriveYouLbl,
        noDataLbl, allLbl,publishDate,Installation_hardware,Installation_software,Specification,Calibration,Technology,
        Repair,Application,Operation,ProductTitleLbl,ProductCategoryLbl
    };

    constructor() {

        super();
        //Get the query string value from url in pubsub
        const querystr = getQueryParams();
        this.SearchType = querystr.filter || '';
        this.searchQS = querystr.search || '';
        this.viewQS = querystr.view || '';
        this.model = querystr.model || '';
        //Get the community url from pubsub
        communityURL = getCommURL();
        this.getCategory();
    }

    connectedCallback() {
        registerListener('searchGlobal', this.searchTechArt, this);
        registerListener('makeFalse', this.makeFalse, this);
        
    }

    disconnectedCallback() {
        unregisterAllListeners(this);
    }

    handleNavigate(evt) {
        // Stop the event's default behavior.
        // Stop the event from bubbling up in the DOM.
        evt.preventDefault();
        evt.stopPropagation();
        // Navigate to the page.
        let url = evt.currentTarget.getAttribute('href') || evt.currentTarget.getAttribute('data-href'),
            navPage = url.split('/').pop().split('?')[0],
            params = getURLParameters(url);

        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: {
                pageName: navPage
            },
            state: params
        });
    }

    async getCategory() {

        getCategories({})
            .then((result) => {
                let tempArr = [];
                for (let key in result) {
                    // Preventing unexcepted data
                    if (result.hasOwnProperty(key)) { // Filtering the data in the loop
                        tempArr.push({ key: result[key], value: key });
                    }
                }
                this.categories = tempArr;
            }).then(() => {
                this.loadChoosenLibraries();
            }).catch((error) => {
                this.error = error;
            });
    }

    triggerSelect(event) {
        
        let limit = clickedViewAll ? null : 5;
        this.searchGrid == true && this.searchTechArt(this.searchTxt);
        const parentEle = this.template.querySelector(".down-search");
        let category = $('input[name=hiddenLevel]', parentEle).val() || null,
            model = $('input[name=hiddenModel]', parentEle).val() || null,
            levelHtml = '', selName;
            
        this.searchGrid == false && this.getAllCategoryData("Installation_hardware__c", model, category, '.install-hardware-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Installation_software__c", model, category, '.install-software-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Specification__c", model, category, '.specification-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Calibration__c", model, category, '.calibration-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Technology__c", model, category, '.technology-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Repair_Physical_damage__c", model, category, '.repair_physical_damage-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Application__c", model, category, '.application-dtTable')
        this.searchGrid == false && this.getAllCategoryData("Operation__c", model, category, '.operation-dtTable')


        category && getCategoryHierarchy({ parentCatCode: category })
            .then(result => {


                if ((result.childInfo.length > 0 || result.models.length > 0) && reachedModel == false) {

                    $('input[name=hiddenModel]', parentEle).val('')
                    let selSize = $(".form-group.select-lg", parentEle).length + 1;
                    let placeHolder = this.label.allLbl, options = [];
                    if (result.childInfo.length > 0) {
                        selName = "category-" + selSize;
                        result.childInfo.forEach(function (item) {
                            options.push(
                                $("<option/>", {
                                    value: item.categoryID,
                                    text: item.categoryName
                                })
                            );
                        });
                    }
                    if (result.models.length > 0) {
                        selName = "model";
                        result.models[0].modelcodes.forEach(function (item) {
                            options.push(
                                $("<option/>", {
                                    value: item,
                                    text: item
                                })
                            );
                        });
                    }

                    levelHtml += '<div class="form-group select-lg">';
                    levelHtml += '<select class="form-control selectpicker' + selSize + '" name="' + selName + '" id="' + selName + '">';
                    levelHtml += '<option value="0">' + placeHolder + '</option>';
                    levelHtml += '</select></div>';

                    $('.dropdown-sec', parentEle).append(levelHtml);
                    const selBox = this.template.querySelector(".selectpicker" + selSize),
                        triggerClick = this.template.querySelector(".triggerClick");
                    $(selBox).find("option").not(":first").remove();
                    $(selBox).append(options);

                    $(selBox).chosen({
                        disable_search: false
                    }).change(function (e) {

                        $("#" + $(this).attr("id"), parentEle).parent(".form-group").nextAll('.form-group').remove();
                        $(selBox).val($(this).val()).trigger("chosen:updated");
                        e.target.name != 'model' && (reachedModel = false, $('input[name=hiddenModel]', parentEle).val(''), $('input[name=hiddenLevel]', parentEle).val($(this).val()));
                        e.target.name == 'model' && (reachedModel = true, $('input[name=hiddenModel]', parentEle).val($(this).val()));
                        if ($(this).val() != 0) {
                            triggerClick.click();
                        } else {
                            let prevCate = $(this).parent().prev('.form-group.select-lg').find('select').val();
                            $('input[name=hiddenLevel]', parentEle).val(prevCate)
                            if(prevCate){
                                triggerClick.click();
                                $(this).parent().remove();
                           }
                        }
                    });
                }

            }).then(() => {
                this.viewQS && this.recentUpdateDownload(1);
            }).catch(error => {
                this.error = error;
                console.log('triggerSelect catch: ' + JSON.stringify(this.error));
            });

        category == null && this.viewQS && this.recentUpdateDownload(1);
    }

    async loadChoosenLibraries() {

        loadStyle(this, YG_CustomerPortal + "/YG_CSS/chosen.css").then(() => {
            loadScript(this, YG_CustomerPortal + "/YG_JS/chosen.jquery.js").then(() => {

                const selectpicker = this.template.querySelectorAll(".selectpicker"),
                    parentEle = this.template.querySelector(".down-search"),
                    triggerClick = this.template.querySelector(".triggerClick");

                $(selectpicker).chosen({
                    disable_search: false
                }).change(function (e) {
                    reachedModel = false;
                    $(".dropdown-sec", parentEle).find(".form-group").not(":first").remove();
                    $(selectpicker).val($(this).val()).trigger("chosen:updated");
                    $('input[name=hiddenLevel]', parentEle).val($(this).val());
                    //if ($(this).val() !== 0) {
                                    
                        triggerClick.click();
                    //}
                    
                });

                this.model == '' && this.viewQS == '' && this.searchQS == '' && this.autoChecked();
                this.viewQS && this.recentUpdateDownload();
                this.model && this.getCategoryOfModel(this.model);
            })
        })
    }

    async getCategoryOfModel(model) {

        let key = [], value = [];
        const topParentEle = this.template.querySelector(".down-section");

        getCategoryOfModel({ modelCod: model })
            .then(result => {
                return result;
            }).then((result) => {

                let catDropdown = '', modelDropdown = ''
                key = Object.keys(result), value = Object.values(result)
                $('.selectpicker:eq(0)', topParentEle).prop('disabled', true).trigger("chosen:updated")
                $(".custom-chkbox input", topParentEle).prop("checked", true);

                catDropdown += '<div class="form-group select-lg">';
                catDropdown += '<select class="form-control selectpicker-1" name="cat" id="cat">';
                catDropdown += '<option value="0">' + key[0] + '</option>';
                catDropdown += '</select></div>';
                $('.dropdown-sec', topParentEle).append(catDropdown);
                const catSelBox = this.template.querySelector(".selectpicker-1");

                modelDropdown += '<div class="form-group select-lg">';
                modelDropdown += '<select class="form-control selectpicker-2" name="model" id="model">';
                modelDropdown += '<option value="0">' + value[0] + '</option>';
                modelDropdown += '</select></div>';
                $('.dropdown-sec', topParentEle).append(modelDropdown);
                const modSelBox = this.template.querySelector(".selectpicker-2");

                $(catSelBox).chosen({ disable_search: true });
                $(modSelBox).chosen({ disable_search: true });

            }).then((result) => {
                $('.installHardware-grid, .installSoftware-grid, .specification-grid, .calibrations-grid, .technologys-grid, .repair_physical_damages-grid, .applications-grid, .specification-grid', topParentEle).show()
                this.getAllCategoryData("Installation_hardware__c", value[0], key[0], '.install-hardware-dtTable')
                setTimeout(() => {
                    this.getAllCategoryData("Installation_software__c", value[0], key[0], '.install-software-dtTable')
                }, 500);
                setTimeout(() => {
                    this.getAllCategoryData("Specification__c", value[0], key[0], '.specification-dtTable')
                }, 1000);
                setTimeout(() => {
                    this.getAllCategoryData("Calibration__c", value[0], key[0], '.calibration-dtTable')
                }, 1000);
                setTimeout(() => {
                    this.getAllCategoryData("Technology__c", value[0], key[0], '.technology-dtTable')
                }, 1000);
                setTimeout(() => {
                    this.getAllCategoryData("Repair_Physical_damage__c", value[0], key[0], '.repair_physical_damage-dtTable')
                }, 1000);
                setTimeout(() => {
                    this.getAllCategoryData("Application__c", value[0], key[0], '.application-dtTable')
                }, 1000);
                setTimeout(() => {
                    this.getAllCategoryData("Operation__c", value[0], key[0], '.operation-dtTable')
                }, 1000);

            }).catch(error => {
                this.error = error;
                console.log('getCategoryOfModel catch: ' + JSON.stringify(this.error));
            });

    }
    makeFalse(){
        this.hasInstallationSoft = false;
        this.hasInstallationHard = false;
        this.hasSpecification = false;
        this.hasCalibration = false;
        this.hasTechnology = false;
        this.hasRepair = false;
        this.hasApplication = false;
        this.hasOperation = false;
        this.showErrorMsg = false;
    }
    async loadExternalLibraries(renderClass, gridData) {
        loadStyle(this, YG_CustomerPortal + '/YG_CSS/dataTables.css').then(() => {
            loadScript(this, YG_CustomerPortal + '/YG_JS/jquery.dataTables.min.js').then(() => {

                let dataTable;
                const table = this.template.querySelector(renderClass),
                    columnHeaders = [this.label.ProductTitleLbl,this.label.ProductCategoryLbl, this.label.applicationModelLbl, this.label.publishDate];
                let columnHeaderHtml = '<thead><tr>';
                columnHeaders.forEach(function (header, index) {
                    columnHeaderHtml += '<th><span class="font-weight-normal">' + header + '</span></th>';
                });
                columnHeaderHtml += '</tr></thead>';
                table.innerHTML = columnHeaderHtml;

                if ($.fn.dataTable.isDataTable(table)) {
                    $(table).DataTable().clear().destroy();
                }
                dataTable = $(table).DataTable({
                    "paging": false,
                    "searching": false, // false to disable search (or any other option)
                    "info": false,
                    "order": [3, 'desc'],
                    "columnDefs": [{
                        orderable: false,
                        targets: []
                    }],
                    "stripeClasses": [],
                    "language": {
                        "emptyTable": this.label.noDataLbl
                    },
                    // Per-row function to iterate cells
                    "createdRow": function (row, data, rowIndex) {
                        // Per-cell function to do whatever needed with cells
                        $.each($('td', row), function (colIndex) {
                            // For example, adding data-* attributes to the cell
                            $(this).attr('data-title', columnHeaders[colIndex]);
                        });
                    }
                });
                const svgLockIcon = '<svg class="mr-1" width="9" height="12" viewBox="0 0 9 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.02766 3.9267H1.84983C1.97316 3.9267 2.05538 3.85747 2.05538 3.71901V3.69593C2.05538 2.38054 3.06254 1.29593 4.25468 1.38824C5.34406 1.48054 6.16623 2.54208 6.16623 3.78824V3.71901C6.16623 3.85747 6.24844 3.9267 6.37177 3.9267H7.19394C7.31727 3.9267 7.39948 3.85747 7.39948 3.71901V3.69593C7.39948 1.59593 5.83736 -0.0886871 3.94637 0.00362063C2.19926 0.0959283 0.86323 1.75747 0.822122 3.71901C0.842676 3.83439 0.924893 3.9267 1.02766 3.9267ZM0.822122 3.71899V3.8113V3.71899ZM8.2217 5.77285C8.2217 5.26516 7.85172 4.84977 7.39953 4.84977H0.82217C0.369977 4.84977 0 5.26516 0 5.77285V10.1575C0 10.6652 0.369977 11.0805 0.82217 11.0805H7.39953C7.85172 11.0805 8.2217 10.6652 8.2217 10.1575V5.77285ZM5.05628 9.39595C5.09739 9.53441 4.99462 9.69595 4.85074 9.69595H3.35028C3.2064 9.69595 3.12418 9.55749 3.14474 9.39595L3.51472 8.01134C3.2064 7.78057 3.02141 7.36518 3.08308 6.90365C3.16529 6.46518 3.47361 6.11903 3.88469 6.02672C4.54243 5.88826 5.11795 6.41903 5.11795 7.11134C5.11795 7.48057 4.95351 7.82672 4.68631 8.01134L5.05628 9.39595Z" fill="#A2B8C8" fill-opacity="0.7"/></svg>';

                gridData.forEach(function (list) {
                    let titleSec = '';
                    let catSec;
                    let appmodel ='';
                    if(list.title){
                        if(list.exclusive==true){
                         titleSec = '<div class="d-flex" style="align-items: flex-start;"><span style="margin-right: 8px;">'+svgLockIcon+'</span>'+'<a href='+communityURL+'knowledge-base-details?refer=tech-articles&id='+list.articleNo+'><u>'+list.title+'</u></p><span><a href="">'+'</a></span></div>';  

                        }else{
                         titleSec = '<div class="d-flex" style="align-items: flex-start;"><span>'+'</span>'+'<a href='+communityURL+'knowledge-base-details?refer=tech-articles&id='+list.articleNo+'><u>'+list.title+'</u></p><span><a href="">'+'</a></span></div>';  

                        }
                        

                     }
                     else{
                         titleSec = ' -'+'<span><a href="#">'+'</a></span>';
                     }
                     if(list.applicableModText.length>0){
                        appmodel =list.applicableModText;
                     }else{
                       appmodel=list.applicableMod;
                     } 
                    //  if(list.categoryName.length>0){
                    //     catSec=list.categoryName[1];
                    //  }else{
                    //     catSec='-'; 
                    //  }
                    //  if(list.applicableModText.length > 0){
                    //     appmod=list.applicableModText;
                    //  }else{
                    //     appmod=list.applicableMod;
                    //  }
                    dataTable.row.add([
                        //`<a href="javascript:void(0)" data-link-url="${communityURL}download-details?id=${list.articleNumber}" class="v2Link text-hover-color text-decoration trigger-navigate">${list.title || "-"}</a>`,
                        titleSec, 
                        list.categoryName || '-',
                        appmodel && appmodel.length > 3 ?
                            `${appmodel.slice(0, 3).join(", ")}
                                <span class= "tooltip-sec position-relative d-block mt-2" >
                                + ${appmodel.length - 3} ${moreLbl}
                                <span class= "tooltiptext model-txt py-4 px-3 f12 grey-darkest mt-2" >
                                ${appmodel.join(", ")}
                                </span ></span >` : `${appmodel.join(", ") || "-"}`,
                        `<span class="d-none">${list.rawDateForSort || "-"}</span>${list.lastPublishedDateWithTime || "-"}`
                    ]);
                })

                dataTable.draw();

                const triggerNav = this.template.querySelector('.triggerNav');
                $(".trigger-navigate", table).click(function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    $(triggerNav).attr('data-href', $(this).attr('data-link-url'));
                    triggerNav.click();
                });
            })
        })
    }

    async getAllCategoryData(type, model, category, grid1Cls) {
        
        searchTechArt({ searchvalue: null, articleType: type, modelcod: model, categoryCod: category })
            .then(result => {
                
                return result;
            }).then((result) => {
                this.loadExternalLibraries(grid1Cls, result);
            }).catch(error => {
                this.error = error;
                console.log('getAllCategoryData catch: ' + JSON.stringify(this.error));
            });
    }

    searchTechArt(searchText){
            
            const topParentEle = this.template.querySelector(".down-section");
            clickedViewAll = false;
            if (searchText) {
                
                let containsAND=false;
                
                    searchText=searchText.replaceAll(/\s+/g, ' ');
                

                this.searchTxt = searchText;
                this.searchGrid = true;
                const parentEle = this.template.querySelector(".down-search");
                this.searchQS && $(".custom-chkbox input:checkbox", parentEle).prop("checked", true)

                let category = $('input[name=hiddenLevel]', parentEle).val() || null, model = $('input[name=hiddenModel]', parentEle).val() || null;
                $('.installHardware-grid, .installSoftware-grid, .specification-grid,.calibrations-grid, .technologys-grid, .repair_physical_damages-grid, .applications-grid, .operations-grid, .installHardware-grid1, .installSoftware-grid1, .specification-grid1,.calibrations-grid1, .technologys-grid1, .repair_physical_damages-grid1, .applications-grid1, .operations-grid1', topParentEle).hide();
                $('.installHardware-grid1, .installSoftware-grid1, .specification-grid1,.calibrations-grid1, .technologys-grid1, .repair_physical_damages-grid1, .applications-grid1, .operations-grid1', topParentEle).show();
                const checkedVal = $(".custom-chkbox input:checkbox:checked", parentEle).map(function () {
                    return $(this).data('name');
                }).get();
                const regex = /"(.*?)"/g; 
                const matches = searchText.match(regex);
                if (matches) {
                searchText=searchText;
               
                }
             else{
                if(searchText.includes(' ')){ // 3377
                    if(searchText.includes(' AND ') || searchText.includes(' and ')){
                        searchText=searchText;
                        if(searchText.includes(' and ')){
                            searchText=searchText.replace('and' ,'AND');
                        }

                    }else if(searchText.includes(' OR ') || searchText.includes(' or ')){
                        searchText=searchText;
                        if(searchText.includes(' or ')){
                            searchText=searchText.replace('or' ,'OR');
                        }
                    }else if(searchText.includes(' | ')){
                        searchText=searchText.replace('|' ,'OR');
                    }else if(searchText.includes(' -')){
                        searchText=searchText;
                        

                    }else if(searchText.includes('*')){
                        let splitstr=searchText.split('*');
                        searchText=splitstr[0].trim();
                        // searchText=searchText;

                    }
                    else{
                    searchText=searchText.replace(' ' ,' AND ');

                    }
                    
                    
                }
                if(searchText.includes('*')){
                    let splitstr1=searchText.split('*');
                    searchText=splitstr1[0].trim();
                }

                
                }//3377
                
                
              
                

                searchTechArt({ searchvalue: searchText, articleType: checkedVal, modelcod: model, categoryCod: category })
                .then(result => {
                    this.categorizedResults = result.map(article => ({
                        applicableMod: article.applicableMod,
                        applicableModText: article.applicableModText,
                        articleNumber: article.articleNo, // Renamed to match the response field
                        categoryCode: article.categoryCode,
                        categoryName: article.categoryName,
                        category: article.categoryDataSelection, // Renamed to match the response field
                        exclusive: article.exclusive,
                        kbId: article.kbId,
                        lastPublishedDate: article.lastPublishedDate,
                        lastPublishedDateWithTime: article.lastPublishedDateWithTime,
                        rawDateForSort: article.rawDateForSort,
                        title: article.title,
                    }));
                   
                    return result;
                
                }).then((result) => {
                    if(this.searchGrid == true){
                        this.hasInstallationSoft = true;
                        this.hasInstallationHard = true;
                        this.hasSpecification = true;
                        this.hasTechnology = true;
                        this.hasRepair = true;
                        this.hasApplication = true;
                        this.hasOperation = true;
                        this.hasCalibration = true;
                    }else{
                        this.hasInstallationSoft = false;
                        this.hasInstallationHard = false;
                        this.hasSpecification = false;
                        this.hasTechnology = false;
                        this.hasRepair = false;
                        this.hasApplication = false;
                        this.hasOperation = false;
                        this.hasCalibration = false;
                    }
                    const hasInstallationSoftResults = this.categorizedResults.some(result => result.category.includes('Installation (hardware)') || result.category.includes('インストール（ハードウェア)'));
                    const hasInstallationHardResults = this.categorizedResults.some(result => result.category.includes('Installation (software)') || result.category.includes('インストール（ソフトウェア）'));
                    const hasSpecificationResults = this.categorizedResults.some(result => result.category.includes('Specification') || result.category.includes('仕様'));
                    const hasCalibrationResults = this.categorizedResults.some(result => result.category.includes('Calibration') || result.category.includes('校正'));
                    const hasTechnologyResults = this.categorizedResults.some(result => result.category.includes('Technology') || result.category.includes('技術情報'));
                    const hasRepairResults = this.categorizedResults.some(result => result.category.includes('Repair & Physical damage') || result.category.includes('修理・物理的損傷'));
                    const hasApplicationResults = this.categorizedResults.some(result => result.category.includes('Application') || result.category.includes('アプリケーション'));
                    const hasOperationResults = this.categorizedResults.some(result => result.category.includes('Operation') || result.category.includes('操作方法'));
                    
                    if (hasInstallationSoftResults && this.chkValue0 == true) {
                        this.hasInstallationSoft = true;
                        const hasInstallationSoftData = this.categorizedResults.filter(result => result.category.includes('Installation (hardware)') || result.category.includes('インストール（ハードウェア)'));
                        this.loadExternalLibraries('.hasInstallationSoft-dtTable1',  hasInstallationSoftData);
                    }else if(this.chkValue0 == true){
                        this.loadExternalLibraries('.hasInstallationSoft-dtTable1',  []);
                        }else{
                            this.hasInstallationSoft = false;
                        }

                    if (hasInstallationHardResults && this.chkValue1 == true) {
                        this.hasInstallationHard = true;
                        const hasInstallationHardData = this.categorizedResults.filter(result => result.category.includes('Installation (software)') || result.category.includes('インストール（ソフトウェア）'));
                        this.loadExternalLibraries('.hasInstallationHard-dtTable1', hasInstallationHardData);
                    }else if(this.chkValue1 == true){
                        this.loadExternalLibraries('.hasInstallationHard-dtTable1',  []);
                        }else{
                            this.hasInstallationHard = false;
                        }

                    if (hasSpecificationResults && this.chkValue2 == true) {
                        this.hasSpecification = true;
                        const hasSpecificationData = this.categorizedResults.filter(result => result.category.includes('Specification') || result.category.includes('仕様'));
                        this.loadExternalLibraries('.hasSpecification-dtTable1',  hasSpecificationData);
                    }else if(this.chkValue2 == true){
                        this.loadExternalLibraries('.hasSpecification-dtTable1',  []);
                        }else{
                            this.hasSpecification = false;
                        }

                    if (hasCalibrationResults && this.chkValue3 == true) {
                        this.hasCalibration = true;
                        const hasCalibrationData = this.categorizedResults.filter(result => result.category.includes('Calibration') || result.category.includes('校正'));
                        this.loadExternalLibraries('.hasCalibration-dtTable1',  hasCalibrationData);
                    }else if(this.chkValue3 == true){
                        this.loadExternalLibraries('.hasCalibration-dtTable1',  []);
                        }else{
                            this.hasCalibration = false;
                        }

                    if (hasTechnologyResults && this.chkValue4 == true) {
                        this.hasTechnology = true;
                        const hasTechnologyData = this.categorizedResults.filter(result => result.category.includes('Technology') || result.category.includes('技術情報'));
                        this.loadExternalLibraries('.hasTechnology-dtTable1', hasTechnologyData);
                    }else if(this.chkValue4 == true){
                        this.loadExternalLibraries('.hasTechnology-dtTable1',  []);
                        }else{
                            this.hasTechnology = false;
                        }

                    if (hasRepairResults && this.chkValue5 == true) {
                        this.hasRepair = true;
                        const hasRepairResultsData = this.categorizedResults.filter(result => result.category.includes('Repair & Physical damage') || result.category.includes('修理・物理的損傷'));
                        this.loadExternalLibraries('.hasRepairResults-dtTable1',  hasRepairResultsData);
                    }else if(this.chkValue5 == true){
                        this.loadExternalLibraries('.hasRepairResults-dtTable1',  []);
                        }else{
                            this.hasRepair = false;
                        }

                    if (hasApplicationResults && this.chkValue6 == true) {
                        this.hasApplication = true;
                        const hasApplicationData = this.categorizedResults.filter(result => result.category.includes('Application') || result.category.includes('アプリケーション'));
                        this.loadExternalLibraries('.hasApplication-dtTable1',  hasApplicationData);
                    }else if(this.chkValue6 == true){
                        this.loadExternalLibraries('.hasApplication-dtTable1',  []);
                        }else{
                            this.hasApplication = false;
                        }

                    if (hasOperationResults && this.chkValue7 == true) {
                        this.hasOperation = true;
                        const hasOperationData = this.categorizedResults.filter(result => result.category.includes('Operation') || result.category.includes('操作方法'));
                        this.loadExternalLibraries('.hasOperation-dtTable1', hasOperationData);
                    }else if(this.chkValue7 == true){
                        this.loadExternalLibraries('.hasOperation-dtTable1',  []);
                        }else{
                            this.hasOperation = false;
                        }
                    // this.loadExternalLibraries('.searchDown-dtTable', result);
                }).catch(error => {
                    this.error = error;
                    
                    console.log('searchTechArt catch: ' + JSON.stringify(this.error));
                });
            } else {

            this.searchTxt = "";
            this.searchGrid = false;
            $('.installHardware-grid1, .installSoftware-grid1, .specification-grid1,.calibrations-grid1, .technologys-grid1, .repair_physical_damages-grid1, .applications-grid1, .operations-grid1', topParentEle).hide();
            this.resetFilter(1);
            }
        }

    autoChecked() {

        const chkboxQS = this.template.querySelectorAll(".custom-chkbox input");
        const topParentEle = this.template.querySelector(".down-section");
        const parentEle = this.template.querySelector(".down-search");
        let category = $('input[name=hiddenLevel]', parentEle).val() || null, model = $('input[name=hiddenModel]', parentEle).val() || null;
        let indexTochk = 0, indexTochk1 = 1,indexTochk2 = 2,indexTochk3 = 3,indexTochk4 = 4,indexTochk5 = 5,indexTochk6 = 6,indexTochk7 = 7;
        indexTochk1 = this.SearchType == 'Firmware' ? 1 : indexTochk1;
        indexTochk2 = this.SearchType == 'Drivers' ? 2 : indexTochk2;
        indexTochk3 = this.SearchType == 'Calibrations' ? 3 : indexTochk3;
        indexTochk4 = this.SearchType == 'Technologys' ? 4 : indexTochk4;
        indexTochk5 = this.SearchType == 'Repair_Physical_damages' ? 5 : indexTochk5;
        indexTochk6 = this.SearchType == 'Applications' ? 6 : indexTochk6;
        indexTochk7 = this.SearchType == 'Operations' ? 7 : indexTochk7;
        //  $(chkboxQS).eq(indexTochk).prop("checked", true)
        $(chkboxQS).prop("checked", true)
        indexTochk == 0 && ($('.installHardware-grid', topParentEle).show(), this.getAllCategoryData("Installation_hardware__c", model, category, '.install-hardware-dtTable'))
        indexTochk1 == 1 && ($('.installSoftware-grid', topParentEle).show(), this.getAllCategoryData("Installation_software__c", model, category, '.install-software-dtTable'))
        indexTochk2 == 2 && ($('.specification-grid', topParentEle).show(), this.getAllCategoryData("Specification__c", model, category, '.specification-dtTable'))
        indexTochk3 == 3 && ($('.calibrations-grid', topParentEle).show(), this.getAllCategoryData("Calibration__c", model, category, '.calibration-dtTable'))
        indexTochk4 == 4 && ($('.technologys-grid', topParentEle).show(), this.getAllCategoryData("Technology__c", model, category, '.technology-dtTable'))
        indexTochk5 == 5 && ($('.repair_physical_damages-grid', topParentEle).show(), this.getAllCategoryData("Repair_Physical_damage__c", model, category, '.repair_physical_damage-dtTable'))
        indexTochk6 == 6 && ($('.applications-grid', topParentEle).show(), this.getAllCategoryData("Application__c", model, category, '.application-dtTable'))
        indexTochk7 == 7 && ($('.operations-grid', topParentEle).show(), this.getAllCategoryData("Operation__c", model, category, '.operation-dtTable'))
    }

    handleChkChange(event) {

        if (this.viewQS) {
            this.recentUpdateDownload(1);
            return;
        }
        
        const topParentEle = this.template.querySelector(".down-section"),
            parentEle = this.template.querySelector(".down-search");
        let category = $('input[name=hiddenLevel]', parentEle).val() || null, model = $('input[name=hiddenModel]', parentEle).val() || null,
            target = event.currentTarget, chkValue = target.value, chkedOrNot = target.checked, highlightSec;
        $('.installHardware-grid, .installSoftware-grid, .specification-grid, .calibrations-grid, .technologys-grid, .repair_physical_damages-grid, .applications-grid, .operations-grid, .installHardware-grid1, .installSoftware-grid1, .specification-grid1, .calibrations-grid1, .technologys-grid1, .repair_physical_damages-grid1, .applications-grid1, .operations-grid1', topParentEle).hide();

        $(".custom-chkbox input:checkbox:checked", topParentEle).map(function () {
            $(this).val() == 0 && $('.installHardware-grid', topParentEle).show()
            $(this).val() == 1 && $('.installSoftware-grid', topParentEle).show()
            $(this).val() == 2 && $('.specification-grid', topParentEle).show()
            $(this).val() == 3 && $('.calibrations-grid', topParentEle).show()
            $(this).val() == 4 && $('.technologys-grid', topParentEle).show()
            $(this).val() == 5 && $('.repair_physical_damages-grid', topParentEle).show()
            $(this).val() == 6 && $('.applications-grid', topParentEle).show()
            $(this).val() == 7 && $('.operations-grid', topParentEle).show()
        })

        chkValue == 0 && (this.softwareGrid = chkedOrNot, highlightSec = '.installHardware-grid')
        chkValue == 1 && (this.firmwareGrid = chkedOrNot, highlightSec = '.installSoftware-grid')
        chkValue == 2 && (this.driversGrid = chkedOrNot, highlightSec = '.specification-grid')
        chkValue == 3 && (this.CalibrationsGrid = chkedOrNot, highlightSec = '.calibrations-grid')
        chkValue == 4 && (this.TechnologysGrid = chkedOrNot, highlightSec = '.technologys-grid')
        chkValue == 5 && (this.Repair_Physical_damagesGrid = chkedOrNot, highlightSec = '.repair_physical_damages-grid')
        chkValue == 6 && (this.ApplicationsGrid = chkedOrNot, highlightSec = '.applications-grid')
        chkValue == 7 && (this.OperationsGrid = chkedOrNot, highlightSec = '.operations-grid')


        if(chkValue == 0 && chkedOrNot == false){
            this.chkValue0 = false;
        }else if(chkValue == 0 && chkedOrNot == true){
            this.chkValue0 = true;
        }

        if(chkValue == 1 && chkedOrNot == false){
            this.chkValue1 = false;
        }else if(chkValue == 1 && chkedOrNot == true){
            this.chkValue1 = true;
        }

        if(chkValue == 2 && chkedOrNot == false){
            this.chkValue2 = false;
        }else if(chkValue == 2 && chkedOrNot == true){
            this.chkValue2 = true;
        }
        if(chkValue == 3 && chkedOrNot == false){
            this.chkValue3 = false;
        }else if(chkValue == 3 && chkedOrNot == true){
            this.chkValue3 = true;
        }

        if(chkValue == 4 && chkedOrNot == false){
            this.chkValue4 = false;
        }else if(chkValue == 4 && chkedOrNot == true){
            this.chkValue4 = true;
        }

        if(chkValue == 5 && chkedOrNot == false){
            this.chkValue5 = false;
        }else if(chkValue == 5 && chkedOrNot == true){
            this.chkValue5 = true;
        }
        if(chkValue == 6 && chkedOrNot == false){
            this.chkValue6 = false;
        }else if(chkValue == 6 && chkedOrNot == true){
            this.chkValue6 = true;
        }

        if(chkValue == 7 && chkedOrNot == false){
            this.chkValue7 = false;
        }else if(chkValue == 7 && chkedOrNot == true){
            this.chkValue7 = true;
        }

        
        if (this.searchGrid === true) {
            this.searchQS = '';
            this.searchTechArt(this.searchTxt);
            return;
        }

        chkValue == 0 && this.softwareGrid == true && this.getAllCategoryData("Installation_hardware__c", model, category, '.install-hardware-dtTable')
        chkValue == 1 && this.firmwareGrid == true && this.getAllCategoryData("Installation_software__c", model, category, '.install-software-dtTable')
        chkValue == 2 && this.driversGrid == true && this.getAllCategoryData("Specification__c", model, category, '.specification-dtTable')
        chkValue == 3 && this.CalibrationsGrid == true && this.getAllCategoryData("Calibration__c", model, category, '.calibration-dtTable')
        chkValue == 4 && this.TechnologysGrid == true && this.getAllCategoryData("Technology__c", model, category, '.technology-dtTable')
        chkValue == 5 && this.Repair_Physical_damagesGrid == true && this.getAllCategoryData("Repair_Physical_damage__c", model, category, '.repair_physical_damage-dtTable')
        chkValue == 6 && this.ApplicationsGrid == true && this.getAllCategoryData("Application__c", model, category, '.application-dtTable')
        chkValue == 7 && this.OperationsGrid == true && this.getAllCategoryData("Operation__c", model, category, '.operation-dtTable')

        chkedOrNot == true && setTimeout(() => {
            const focusHighlight = this.template.querySelector(highlightSec);
            $('html, body').animate({
                scrollTop: $(focusHighlight).offset().top - 50
            }, 1000);
        }, 500);
    }

    resetFilter(flag = 0) {

        this.viewQS = "";
        clickedViewAll = false;
        const topParentEle = this.template.querySelector(".down-section");
        $('.last-res, .view-all, .grid-sec', topParentEle).show()
        const chkboxQS = this.template.querySelectorAll(".custom-chkbox input");
        $(chkboxQS).prop("checked", true)
        if (this.searchGrid === true) {
            reachedModel = false;
            const selectpicker = this.template.querySelectorAll(".selectpicker");
            $(selectpicker).val('').prop('disabled', false).trigger("chosen:updated");
            $(".dropdown-sec", topParentEle).find(".form-group").not(":first").remove();
            $('input[name=hiddenLevel], input[name=hiddenModel]', topParentEle).val('')
            fireEvent(this.pageRef, 'clearSearch', 'Y');
            this.searchTechArt();
            return;
        }

        if (flag == 1) {
            $(".custom-chkbox input:checkbox:checked", topParentEle).map(function () {
                $(this).val() == 0 && $('.installHardware-grid', topParentEle).show()
                $(this).val() == 1 && $('.installSoftware-grid', topParentEle).show()
                $(this).val() == 2 && $('.specification-grid', topParentEle).show()
                $(this).val() == 3 && $('.calibrations-grid', topParentEle).show()
                $(this).val() == 4 && $('.technologys-grid', topParentEle).show()
                $(this).val() == 5 && $('.repair_physical_damages-grid', topParentEle).show()
                $(this).val() == 6 && $('.applications-grid', topParentEle).show()
                $(this).val() == 7 && $('.operations-grid', topParentEle).show()
            })
        } else {
            reachedModel = false;
            const selectpicker = this.template.querySelectorAll(".selectpicker");
            $(selectpicker).val('').prop('disabled', false).trigger("chosen:updated");
            $(".dropdown-sec", topParentEle).find(".form-group").not(":first").remove();
            $('input[name=hiddenLevel], input[name=hiddenModel]', topParentEle).val('')
            $('.installHardware-grid, .installSoftware-grid, .specification-grid, .calibrations-grid, .technologys-grid, .repair_physical_damages-grid, .applications-grid, .operations-grid', topParentEle).show()
        }

        $('.viewall-recentdown-grid, .installHardware-grid1, .installSoftware-grid1, .specification-grid1,.calibrations-grid1, .technologys-grid1, .repair_physical_damages-grid1, .applications-grid1, .operations-grid1', topParentEle).hide()
        let category = $('input[name=hiddenLevel]', topParentEle).val() || null, model = $('input[name=hiddenModel]', topParentEle).val() || null;
        this.getAllCategoryData("Installation_hardware__c", model, category, '.install-hardware-dtTable')
        setTimeout(() => {
            this.getAllCategoryData("Installation_software__c", model, category, '.install-software-dtTable')
        }, 500);
        setTimeout(() => {
            this.getAllCategoryData("Specification__c", model, category, '.specification-dtTable')
        }, 1000);
        setTimeout(() => {
            this.getAllCategoryData("Calibration__c", model, category, '.calibration-dtTable')
        }, 1000);
        
        setTimeout(() => {
            this.getAllCategoryData("Technology__c", model, category, '.technology-dtTable')
        }, 1000);
        setTimeout(() => {
            this.getAllCategoryData("Repair_Physical_damage__c", model, category, '.repair_physical_damage-dtTable')
        }, 1000);
        setTimeout(() => {
            this.getAllCategoryData("Application__c", model, category, '.application-dtTable')
        }, 1000);
        setTimeout(() => {
            this.getAllCategoryData("Operation__c", model, category, '.operation-dtTable')
        }, 1000);
        $('html, body').animate({
            scrollTop: $(topParentEle).offset().top - 50
        }, 1000);
        this.chkValue0 = true;
        this.chkValue1 = true;
        this.chkValue2 = true;
        this.chkValue3 = true;
        this.chkValue4 = true;
        this.chkValue5 = true;
        this.chkValue6 = true;
        this.chkValue7 = true;
        this.showErrorMsg = false;
    }

    async recentUpdateDownload(flag = 0) {

        setTimeout(() => {
            const topParentEle = this.template.querySelector(".down-section");
            $('.installHardware-grid, .installSoftware-grid, .specification-grid, .calibrations-grid, .technologys-grid, .repair_physical_damages-grid, .applications-grid, .operations-grid', topParentEle).hide();
            $('.viewall-recentdown-grid', topParentEle).show();
            if (flag != 1) {
                const chkboxQS = this.template.querySelectorAll(".custom-chkbox input");
                $(chkboxQS).prop("checked", true)
            }
            const checkedVal = $(".custom-chkbox input:checkbox:checked", topParentEle).map(function () {
                return $(this).data('name');
            }).get();
            let category = $('input[name=hiddenLevel]', topParentEle).val() || null, model = $('input[name=hiddenModel]', topParentEle).val() || null;
            this.getRecentlyUploadDownloads(checkedVal, model, category, '.recentUpdtDown-dtTable')
        }, 1000);
    }

    getRecentlyUploadDownloads(checkedVal, model, category, gridClass) {

        getRecentlyUploadDownloads({ articleType: checkedVal, modelcod: model, categoryCod: category, limitn: null })
            .then((result) => {
                return result;
            }).then((result) => {
                this.loadExternalLibraries(gridClass, result);
            }).catch((error) => {
                this.error = error.message;
            });
    }

    doViewAll(event) {

        let target = $(event.currentTarget), parentClass = target.data('parent');
        clickedViewAll = true;
        const topParentEle = this.template.querySelector(".down-section");

        parentClass == '.installHardware-grid' && $('.installHardware-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });

        parentClass == '.installSoftware-grid' && $('.installSoftware-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });

        parentClass == '.specification-grid' && $('.specification-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.calibrations-grid' && $('.calibrations-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.technologys-grid' && $('.technologys-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.repair_physical_damages-grid' && $('.repair_physical_damages-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.applications-grid' && $('.applications-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.operations-grid' && $('.operations-grid .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });

        parentClass == '.installHardware-grid1' && $('.installHardware-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });

        parentClass == '.installSoftware-grid1' && $('.installSoftware-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });

        parentClass == '.specification-grid1' && $('.specification-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.calibrations-grid1' && $('.calibrations-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.technologys-grid1' && $('.technologys-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.repair_physical_damages-grid1' && $('.repair_physical_damages-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.applications-grid1' && $('.applications-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
        parentClass == '.operations-grid1' && $('.operations-grid1 .grid-sec', topParentEle).slideToggle('slow', function () {
            target.toggleClass('active', $(this).is(':visible'));
        });
    }
}