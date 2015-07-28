/**
 * @file the main function of the edit
 * @author Mofei Zhu <zhuwenlong@baidu.com>
 */

// new map and some init
var map = new BMap.Map('map', {
	enableMapClick: false
});

var mercatorProjection = map.getMapType().getProjection();
map.centerAndZoom(new BMap.Point(116.403119, 39.928658), 12);
map.enableScrollWheelZoom();
var mapv;
var data = null;
var options = {
	map: map
};
mapv = new Mapv(options);
//

var app;

// load config
requirejs.config({
	baseUrl: '/javascripts/edit',
});

// main
requirejs(['uploadDate', 'editActions', 'sort', 'login', 'gitOp'], function (upCallback, edit, sort, login, git) {
	// new app
	app = new edit();
	// init sort action and login
	sort.init(app);
	login.reg(app);
	// listen to the uplodaData's callback;
	var pointData,options;
	upCallback(function(data){
		pointData = data;
		app.shwoEdit()
	});
	// the edit done event
	app.done(function(options){
		// create a new layer
		var name = (+new Date()).toString(36)+ (Math.random()*10e7|0).toString(36);
		var layerInfo = {
			name: name,
			mapv: mapv,
			data: pointData,
			drawType: options.type,
			drawOptions: options.option
		}
		var layer = new Mapv.Layer(layerInfo);
		$('.E-layers').append('<div class="E-layers-block E-layers-layer" name="'+name+'">'+options.type.substring(0,2).toUpperCase()+'</div>');
		app.addLayer(layer);

		// update and save info
		var project = 'default';
		var config = login.config();
		config[project].layers[name] = {};
		config[project].layers[name].options = options;
		config[project].layers[name].data = 'data/'+name;
		// upload Date
		console.info('start update layer for ',name);
		var pointStr = JSON.stringify(pointData);
		var data = {
		  "message": "add layer data for layer " + name,
		  "content": git.utf8_to_b64(pointStr)
		};

		// upload files
		git.createFiles({
			token: login.user.session,
			user: login.user.username,
			path: config[project].layers[name].data,
			data: data,
			success:function(data){
				console.info('update config');
				config[project].layers[name].sha = data.content.sha;
				updateConfig(JSON.stringify(config));
			}
		});

		// upload config
		function updateConfig(conf){
			console.warn(conf)
			var data = {
				'message': 'update config',
				'content': git.utf8_to_b64(conf)
			};
			git.updateFiles({
				token: login.user.session,
				user: login.user.username,
				path: 'mapv_config.json',
				data: data,
				success:function(){
					console.log('config updated');
				}
			})
		}
	})
});

// edity map style
requirejs(['mapstyle'],function(mapstyle){
	mapstyle.setMap(map)
});