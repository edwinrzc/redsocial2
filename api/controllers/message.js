'use strict'

var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');
var Message = require('../models/message');



function probando(req, res){
    res.status(200).send({message: 'Todo va bien'});
}



function saveMessage( req, res ){
    
    var params = req.body;
    
    if( !params.text || !params.receiver )return res.status(200).send({message: 'Debes enviar un texto'});
    
    
    var message = new Message();
    message.text = params.text;
    message.emitter = req.user.sub;
    message.receiver = params.receiver;
    message.created_at = moment().unix();
    message.viewed = 'false';
    
    message.save((err, messageStored)=>{
	
	if(err) return res.status(500).send({message: 'Error en el servidor al guardar el mensaje'});
	
	if(!messageStored) return res.status(404).send({message: 'El mensaje NO ha sido guardada'});
	
	return res.status(200).send({ message:messageStored });
    });
}



function getReceivedMessages( req, res ){
    
    var userId = req.user.sub;
    
    var page = 1;
    
    if(req.params.page){
	page = req.params.page;
    }
    
    var itemsPerPage = 4;
    
    Message.find({receiver: userId}).populate('emitter', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
	
	if(err) return res.status(500).send({message: 'Error en el servidor al guardar el mensaje'});
	
	if(!messages) return res.status(404).send({message: 'No hay mensajes'});
	
	
	return res.status(200).send({
	    messages: messages, 
	    total: total,
	    pages: Math.ceil(total/itemsPerPage)
	});
	
    });
    
}



function getEmmitMessages( req, res ){
    
    var userId = req.user.sub;
    
    var page = 1;
    
    if(req.params.page){
	page = req.params.page;
    }
    
    var itemsPerPage = 4;
    
    Message.find({emitter: userId}).populate('emitter receiver', 'name surname _id nick image').paginate(page, itemsPerPage, (err, messages, total)=>{
	
	if(err) return res.status(500).send({message: 'Error en el servidor al guardar el mensaje'});
	
	if(!messages) return res.status(404).send({message: 'No hay mensajes'});
	
	
	return res.status(200).send({
	    messages: messages, 
	    total: total,
	    pages: Math.ceil(total/itemsPerPage)
	});
	
    });
    
}



function getUnviewedMessages( req, res ){
    var userId = req.user.sub;
    
    Message.count({receiver: userId, viewed: 'false'}).exec((err, count) =>{
	if(err) return res.status(500).send({message: 'Error en la peticion'});
	
	
	return res.status(200).send({
	    'unviewed': count
	});
	
    });
}


function setViewedMessages( req, res ){
    
    var userId = req.user.sub;
    
    Message.update({ receiver: userId, viewed: 'false'},{viewed:'true'}, {'multi': true}, (err, messagesUpdated) =>{
	if(err) return res.status(500).send({message: 'Se ha producido un error en el servidor'});
	
	
	return res.status(200).send({
	    messages: messagesUpdated
	});
    });
    
}


module.exports = {
	probando,
	saveMessage,
	getReceivedMessages,
	getEmmitMessages,
	getUnviewedMessages,
	setViewedMessages
};