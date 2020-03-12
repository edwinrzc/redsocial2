'use strict'
var path = require('path');
var fs = require('fs');
var moment = require('moment');
var mongoosePaginate = require('mongoose-pagination');

var Publication = require('../models/publication');
var User = require('../models/user');
var Follow = require('../models/follow');



function probando( req, res){
    
    res.status(200).send({mensaje: 'Probando desde publication'});
    
}


function savePublication( req, res ){
    
    var params = req.body;
    
    if(!params.text)return res.status(200).send({message: 'Debes enviar un texto'});
    
    var publication = new Publication();
    publication.text = params.text;
    publication.file = 'null';
    publication.user = req.user.sub;
    publication.created_at = moment().unix();
    
    publication.save((err, publicationStored)=>{
	
	if(err) return res.status(500).send({message: 'Error en el servidor al guardar la publicacion'});
	
	if(!publicationStored) return res.status(404).send({message: 'La publiacacion NO ha sido guardada'});
	
	return res.status(200).send({ publication:publicationStored });
    });
}



function getPublications( req, res ){
    
    var page = 1;
    
    if(req.params.page){
	page = req.params.page;
    }
    
    
    var itemsPerPage = 4;
    
    Follow.find({ user: req.user.sub}).populate('followed').exec((err, follows)=>{
	if(err) return res.status(500).send({message: 'error en devolver la publicacion'});
	
	if(!follows) return res.status(404).send({message: 'No se encontraron publicaciones asociadas'});
	
	var follows_clean = [];
	
	follows.forEach((follow) => {
		//por cada iteracion que me cree un objeto follow y lo guardo
	    follows_clean.push(follow.followed);
	});
	
	
	Publication.find({user: {"$in": follows_clean}}).sort('-created_at')
    	.populate('user').paginate(page, itemsPerPage, (err,publications,total) => {
    		if(err) return res.status(500).send({message: 'Error al devolver publicaciones'});
    
    		if(!publications) return res.status(404).send({message: 'No hay publicaciones'});
    
    		return res.status(200).send({
    			total_items: total,
    			pages: Math.ceil(total/itemsPerPage),
    			page: page,
    			publications,
    		});
    	});
	
    });    
    
    
    
}



function getPublication( req, res ){
    var publicationId = req.params.id;
    
    Publication.findById(publicationId, (err, publication)=>{
	if(err) return res.status(500).send({message: 'error en devolver la publicacion'});
	
	if(!publication) return res.status(404).send({message: 'No hay publicacion'});
	
	return res.status(200).send({ publication });
    });
}


function deletePublication( req, res ){
    var publicationId = req. params.id;
    
    Publication.find({ 'user': req.user.sub, '_id': publicationId }).remove(err =>{
	if(err) return res.status(500).send({message: 'error al borrar la publicacion'});
	
	//if(!publicationRemoved) return res.status(404).send({message: 'No se ha borrado la publicacion '});
	
	return res.status(200).send({ message: 'Publicacion eliminada correctamente.' });
    });
}



function uploadImage( req, res ){
	
	var publicationId = req.params.id;
	
	console.log(publicationId);
	if(req.files){
		
		var file_path = req.files.image.path;
		var file_split = file_path.split('\/');
		var file_name = file_split[2];
		var ext_split = file_name.split('\.');
		var file_ext = ext_split[1];
		
		
		
		if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg' || 
		   file_ext == 'gif'){
			
		    
			Publication.findOne({'user':req.user.sub, '_id': publicationId}).exec((err, publication)=>{
				
				if(publication){
				    
				    	Publication.findByIdAndUpdate(publicationId,{file: file_name}, {new:true},(err, publicationUpdated)=>{
        					if(err)return res.status(500).send({menssage: 'Error en el servidor.'});
        					
        					if(!publicationUpdated){
        						return res.status(404).send({menssage: 'No se ha podido actualizar el usuario.'});
        					}
    					
        					return res.status(200).send({publication: publicationUpdated});
    					});
				    
				}else{
				    return removeFilesOfUpload(res, file_path, 'No tienes permiso para actualizar esta publicacion.');
				}
			});
			
		}
		else{
			return removeFilesOfUpload(res, file_path, 'La extension no es valida');
		}
	}
	else{
		return res.status(500).send({menssage: 'No se ha subido imagen.'});
	}
}

function removeFilesOfUpload(res, file_path, message){
	fs.unlink(file_path, ( err )=>{
		return res.status(401).send({ menssage: message });
	});
}



function getImageFile(req, res){
	
	var image_file = req.params.imageFile;
	var path_file = './uploads/publications/'+ image_file;
	
	fs.exists(path_file, (exists)=>{
		if(exists){
			res.sendFile(path.resolve(path_file));
		}
		else{
			return res.status(200).send({ message: 'No existe la imagen...'})
		}
	});
}


module.exports = {
	probando,
	savePublication,
	getPublications,
	getPublication,
	deletePublication,
	uploadImage,
	getImageFile
}

