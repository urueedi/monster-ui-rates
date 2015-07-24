define(function(require){
	var $ = require('jquery'),
		_ = require('underscore'),
		monster = require('monster'),
		toastr = require('toastr');

	var app = {
		name: 'rates',

		css: [ 'app' ],

		i18n: {
			'en-US': { customCss: false },
			'de-DE': { customCss: false },
			'fr-FR': { customCss: false },
			'it-IT': { customCss: false },
			'ro-RO': { customCss: false },
			'nl-NL': { customCss: false },
			'ru-RU': { customCss: false }
		},

		requests: {
		},

		load: function(callback){
			var self = this;

			self.initApp(function() {
				callback && callback(self);
			});
		},

		initApp: function(callback) {
			var self = this;

			/* Used to init the auth token and account id */
			monster.pub('auth.initApp', {
				app: self,
				callback: callback
			});
		},

		render: function(container){
			var self = this;
			self._render(container);
		},

		// subscription handlers
		_render: function(container) {
			var self = this;
			self.getrates(function(data) {
				var ratesArray = {};
				ratesArray.rates = data;
				if(monster.apps.auth.currentAccount.is_reseller == true && monster.apps.auth.currentUser.priv_level == 'admin' && monster.apps.auth.currentUser.enabled == true && monster.apps.auth.currentAccount.superduper_admin == true)
				    ratesArray.is_superadminreseller = true;
				else if(monster.apps.auth.currentAccount.is_reseller == true && monster.apps.auth.currentUser.priv_level == 'admin' && monster.apps.auth.currentUser.enabled == true)
				    ratesArray.is_adminreseller = true;

				ratesTemplate = $(monster.template(self, 'rates-layout', ratesArray)),
				parent = _.isEmpty(container) ? $('#monster-content') : container;
				
				if (ratesArray.rates.length == 0) {
					ratesTemplate.find(".no-rates-row").toggleClass("show");
				}
				
				self.getAccountInfo(function(data) {
					if (!data.hasOwnProperty('ui_help') || data.ui_help === true) {
						ratesTemplate.find(".rates-list").addClass("show-help");
					}
				});

				self.bindEvents(ratesTemplate);
				(parent)
					.empty()
					.append(ratesTemplate);
			});
		},

		bindEvents: function(template) {
			var self = this;
			container = parent.find('.new-content');
			
			template.find(".less").on('click', function(e){
				$(".rates-list").removeClass("show-help");
				
				self.getAccountInfo(function(data) {
					
					data.ui_help = false;
					self.updateAccountInfo(data, function(data){});
				});
			});

			template.find(".more").on('click', function(e){
				$(".rates-list").addClass("show-help");
				
				self.getAccountInfo(function(data) {
					
					data.ui_help = true;
					self.updateAccountInfo(data, function(data){});
				});
			});

			template.find(".add-rates").on('click', function(e){
				self.renderAddPopUp();
			});

			template.find(".edit").on('click', function(e){
				var ratesId = $(this).data('id');
				self.renderEditPopUp(ratesId);
			});

			template.find(".delete").on('click', function(e) {
				var ratesId = $(this).data('id');
				self.getratesDetails(ratesId, function(data) {
					monster.ui.confirm(self.i18n.active().rates.deleteRequest + "("+data.rate_name+")" + "?" , function() {
					
						self.deleteArates(ratesId, function(data) {
							self.render();
							toastr.success(monster.template(self, '!' + "("+data.rate_name+") " + self.i18n.active().rates.toastr.deleteSuccess ));
						});
					});
				});
			});

			template.find('.search-query').on('keyup', function() {
				var searchString = $(this).val().toLowerCase(),
					rows = template.find('.rates-rows .grid-row:not(.title)'),
					emptySearch = template.find('.rates-rows .empty-search-row').toggleClass(".show");

				_.each(rows, function(row) {
					row = $(row);
					row.data('search').toLowerCase().indexOf(searchString) < 0 ? row.hide() : row.show();
				});

				if(rows.size() > 0) {
					rows.is(':visible') ? emptySearch.hide() : emptySearch.show();
				}
			});

			template.find(".upload-rates").on('click', function(e){
				self.renderPopUpload();
			});
		},

		renderAddPopUpload: function() {
			var self = this;
			var Name = '<div class="cd"><input required class="input-small identifier" name="extra.id" type="text" placeholder="Custom Name"></input>';
			var Value = '<input required class="same-line input-small value" name="extra.val" type="text" placeholder="Value"></input>';
			var Delete = '<a class="delete-cd same-line"><i class="icon-trash"></i></a></div>';
			var addratesTemplate = $(monster.template(self, 'rates-popUp'));
			
			// Dynamically add input boxes for adding custom_data
			addratesTemplate.find(".custom").on('click', function(e) {
				
				addratesTemplate.find("#custom-data").append(Name + Value + Delete);
				
				addratesTemplate.find(".delete-cd").on('click', function(e) {
					
					$(this).parent().remove();
				});
			});
			
			addratesTemplate.find("#save").on('click', function(e) {
				
				self.checkFormData(function(formData) {
					self.addArates(formData, function(data) {
						self.render();
						popup.dialog('close').remove();
						toastr.success(monster.template(self, '!' + self.i18n.active().rates.toastr.addSuccess + data.rate_name ));
					});
				});	
			});
			
			var popup = monster.ui.dialog(addratesTemplate, {
				title: self.i18n.active().rates.dialograte.addTitle
			});
		},


		renderAddPopUp: function() {
			var self = this;
			var Name = '<div class="cd"><input required class="input-small identifier" name="extra.id" type="text" placeholder="Custom Name"></input>';
			var Value = '<input required class="same-line input-small value" name="extra.val" type="text" placeholder="Value"></input>';
			var Delete = '<a class="delete-cd same-line"><i class="icon-trash"></i></a></div>';
			var addratesTemplate = $(monster.template(self, 'rates-popUp'));
			
			addratesTemplate.find("#save").on('click', function(e) {
				self.checkFormData(function(formData) {
                                    formData.routes = Array(formData.routes);
                                    formData.options = Array(formData.options);
					self.addArates(formData, function(data) {
						self.render();
						popup.dialog('close').remove();
						toastr.success(monster.template(self, '!' + "("+data.rate_name+") " + self.i18n.active().rates.toastr.addSuccess ));
					});
				});	
			});
			
			var popup = monster.ui.dialog(addratesTemplate, {
				title: self.i18n.active().rates.dialograte.addTitle
			});
		},
		
		renderEditPopUp: function(ratesId) {
			var self = this;

			self.getratesDetails(ratesId, function(data) {
				console.log(data);
				var editratesTemplate = $(monster.template(self, 'rates-popUp', data));
				
				// Iterate through custom_data to print current custom_data
				for (var property in data.custom_data){ 
					var savedName = '<div class="cd"><input required class="input-small identifier" name="extra.id" type="text" value="'+property+'"></input>';
					var savedValue = '<input required class="same-line input-small value" name="extra.val" type="text" value="'+data.custom_data[property]+'"></input>';
					var Delete = '<a class="delete-cd same-line"><i class="icon-trash"></i></a></div>';
					editratesTemplate.find("#custom-data").append(savedName + savedValue + Delete);
				}
				
				var popup = monster.ui.dialog(editratesTemplate, {
					title: self.i18n.active().rates.dialograte.editTitle
				});
				
				editratesTemplate.find(".save").on('click', function(e) {
					self.checkFormData(function(formData) {
                                        formData.routes = Array(formData.routes);
                                        formData.options = Array(formData.options);
						self.updateArates(ratesId, formData, function(data) {
							self.render();
							popup.dialog('close').remove();
							toastr.success(monster.template(self, '!' + " ("+data.rate_name+") " + self.i18n.active().rates.toastr.editSuccess ));
						});
					});
				});
			});		
		},
		
		// Helper function
		checkFormData: function(callback) {
			var self = this;
			var customData = {},
				isValid = true;
				
			$(".cd").each(function(index){
				cdName = $(this).find(".identifier").val();
				cdValue = $(this).find(".value").val();
				
				if (customData.hasOwnProperty(cdName)) {
					isValid = false;
					return false;
				}
				else {
					customData[cdName] = cdValue;
				}	
			});
			
			if (isValid == true) {
				formData = monster.ui.getFormData('form_rates');
				formData.custom_data = customData;
				delete formData.extra;
				callback && callback(formData);
			}
			else {
				monster.ui.alert('warning', self.i18n.active().rates.warning);
			}	
		},

		//utils
		getrates: function(callback){
			var self=this;

			self.callApi({
				resource: 'rates.list',
				data: {
					accountId: self.accountId
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},

		getratesDetails: function(ratesId, callback){
			var self = this;
			
			self.callApi({
				resource: 'rates.get',
				data: {
					accountId: self.accountId,
					rateId: ratesId
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},

		addArates: function(data, callback){
			var self = this;
			
			self.callApi({
				resource: 'rates.create',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data) {
					callback(data.data);
				}
			});
		},
		
		updateArates: function(ratesId, data, callback){
			var self = this;
			
			self.callApi({
				resource: 'rates.update',
				data: {
					accountId: self.accountId,
					rateId: ratesId,
					data: data
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		deleteArates: function(ratesId, callback){
			var self = this;
			self.callApi({
				resource: 'rates.delete',
				data: {
					accountId: self.accountId,
					rateId: ratesId,
					data: {}
				},
				success: function(data) {
					callback && callback(data.data);
				}
			});
		},
		
		//viewratesHistory: function(ratesId, callback){
		//	var self = this;
		//	
		//	self.callApi({
		//		resource: 'rates.summary',
		//		data: {
		//			accountId: self.accountId,
		//			ratesId: ratesId
		//		},
		//		success: function(data) {
		//			callback && callback(data.data);
		//		}
		//	});
		//},
		
		getAccountInfo: function(callback){
			var self = this;
			
			self.callApi({
			
				resource: 'account.get',
				data: {
					accountId: self.accountId
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},
		
		updateAccountInfo: function(data, callback){
			var self = this;
			
			self.callApi({
			
				resource: 'account.update',
				data: {
					accountId: self.accountId,
					data: data
				},
				success: function(data, status) {
					callback(data.data);
				}
			});
		},

		usersRenderMusicOnHold: function(currentUser) {
//			var self = this,
//				silenceMediaId = 'silence_stream://300000';

			self.usersListMedias(function(medias) {
				var templateData = {
						user: currentUser,
						silenceMedia: silenceMediaId,
						mediaList: medias,
						media: 'music_on_hold' in currentUser && 'media_id' in currentUser.music_on_hold ? currentUser.music_on_hold.media_id : silenceMediaId
					},
					featureTemplate = $(monster.template(self, 'users-feature-music_on_hold', templateData)),
					switchFeature = featureTemplate.find('.switch').bootstrapSwitch(),
					popup,
					closeUploadDiv = function(newMedia) {
						var uploadInput = featureTemplate.find('.upload-input');
						uploadInput.wrap('<form>').closest('form').get(0).reset();
						uploadInput.unwrap();
						featureTemplate.find('.upload-div').slideUp(function() {
							featureTemplate.find('.upload-toggle').removeClass('active');
						});
						if(newMedia) {
							var mediaSelect = featureTemplate.find('.media-dropdown');
							mediaSelect.append('<option value="'+newMedia.id+'">'+newMedia.name+'</option>');
							mediaSelect.val(newMedia.id);
						}
					};

				featureTemplate.find('.cancel-link').on('click', function() {
					popup.dialog('close').remove();
				});

				switchFeature.on('switch-change', function(e, data) {
					data.value ? featureTemplate.find('.content').slideDown() : featureTemplate.find('.content').slideUp();
				});

				featureTemplate.find('.upload-toggle').on('click', function() {
					if($(this).hasClass('active')) {
						featureTemplate.find('.upload-div').stop(true, true).slideUp();
					} else {
						featureTemplate.find('.upload-div').stop(true, true).slideDown();
					}
				});

				featureTemplate.find('.upload-cancel').on('click', function() {
					closeUploadDiv();
				});

				featureTemplate.find('.upload-submit').on('click', function() {
					var file = featureTemplate.find('.upload-input')[0].files[0];
						fileReader = new FileReader();

					fileReader.onloadend = function(evt) {
						self.callApi({
							resource: 'media.create',
							data: {
								accountId: self.accountId,
								data: {
									streamable: true,
									name: file.name,
									media_source: "upload",
									description: file.name
								}
							},
							success: function(data, status) {
								var media = data.data;
								self.callApi({
									resource: 'media.upload',
									data: {
										accountId: self.accountId,
										mediaId: media.id,
										data: evt.target.result
									},
									success: function(data, status) {
										closeUploadDiv(media);
									},
									error: function(data, status) {
										self.callApi({
											resource: 'media.delete',
											data: {
												accountId: self.accountId,
												mediaId: media.id,
												data: {}
											},
											success: function(data, status) {
											}
										});
									}
								});
							}
						});
					};

					if(file) {
						if(file.size >= (Math.pow(2,20) * 5)) { //If size bigger than 5MB
							monster.ui.alert(self.i18n.active().users.music_on_hold.fileTooBigAlert);
						} else {
							fileReader.readAsDataURL(file);
						}
					} else {
						monster.ui.alert(self.i18n.active().users.music_on_hold.emptyUploadAlert);
					}
				});

				featureTemplate.find('.save').on('click', function() {
					var selectedMedia = featureTemplate.find('.media-dropdown option:selected').val(),
						enabled = switchFeature.bootstrapSwitch('status');

					if(!('music_on_hold' in currentUser)) {
						currentUser.music_on_hold = {};
					}

					if('media_id' in currentUser.music_on_hold || enabled) {
						if(enabled) {
							currentUser.music_on_hold = {
								media_id: selectedMedia
							};
						} else {
							currentUser.music_on_hold = {};
						}
						self.usersUpdateUser(currentUser, function(updatedUser) {
							popup.dialog('close').remove();
							self.usersRender({ userId: currentUser.id });
						});
					} else {
						popup.dialog('close').remove();
						self.usersRender({ userId: currentUser.id });
					}
				});

				popup = monster.ui.dialog(featureTemplate, {
					title: currentUser.extra.mapFeatures.music_on_hold.title,
					position: ['center', 20]
				});
			});
		}

	};
	return app;
});
