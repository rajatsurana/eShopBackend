var request = require('request')
function sendPushes(pushMessage)
{


	request({
	  uri: "https://gcm-http.googleapis.com/gcm/send",
	  method: "POST",
	  headers: {
	    'Authorization': 'key=AIzaSyA2cj6dAC3UTWlyANDkuxCb4_R7S4S5s6U',
		'Content-type':'application/json'
		},
		json:
		{
			data:
			{
				message: pushMessage
			},
			to:"ekxywP1V6Z8:APA91bG9TZ8NsS7xjRqx2cXg0yy1MzdNvu0ypsiP0_25j98hyTRQi2IiayMVag_WyUEhcl35MqBh1a7GqPQz5bTjHLYLOZ-RJ6KLWhH_GjAG90oNQSDYF1vJe1SsTCGf-B2doxPk5FcA"
		}
	}, function(error, response, body) {
	  console.log(response);
	});
}


module.exports.sendPushes = sendPushes
