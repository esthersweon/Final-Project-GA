import { Component, OnInit,ChangeDetectorRef } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { UserService } from '../user/user.service';
import { PostService } from '../post/post.service';
import { CommentService } from '../comment/comment.service';

// import { NguiMapModule} from '@ngui/map';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})

export class PostComponent implements OnInit {
  private loggedInUser;
   posts = [];
   post;
   title = "";
  private tempTitle = "";
  private tempDescription = "";
  private tempPost = "";
  private tempComment = "";
  private tempSubComment = "";
   description ="";
   image_url;
  private mapInstance;
  private tempLat = 37.76;
  private tempLng = -122.418;
  private lastInfoWindow;
  private helperInfoWindow;
  private inputPlace;
  private lastMarker;
  private editable;
  private editing = false;
  private displayComments;
  private displaySubComment;

  private currPostLength;
  // private positionList:any = new Set();
  private positionList = [];

  clearTempStates(){
    this.tempTitle = "";
    this.tempDescription = "";
    this.tempComment = "";
    this.tempSubComment = "";
    this.displayComments = "";
    this.displaySubComment = "";
    this.editable = "";
    this.editing = false;
    this.displayComments="";
    this.displaySubComment="";
  }

  constructor(
    private userService: UserService,
    private postService: PostService,
    private commentService: CommentService,
  ) {
  }

  ngOnInit() {
    this.postService.getAllPosts()
    .subscribe(res=>{
      this.posts = res.json();
      this.currPostLength = this.posts.length;
    })

    this.userService.getSessionUser()
    .subscribe(data=>{
      console.log('logged in is ', data.json().username);
      this.loggedInUser = data.json();
    },err=>{
      this.loggedInUser = null;
    })
  }

  ngAfterContentChecked(){
    // console.log('after content checked');
    if(this.mapInstance && this.mapInstance.markers){
      if(this.currPostLength < this.mapInstance.markers.length){
        let elements = document.getElementsByClassName('markerInfoWindow');
        console.log('divs are,',elements);
        this.currPostLength =  this.mapInstance.markers.length
        /* BEFORE all of this, i need to write generate a hidden profile template
        that has div for img src, angular on click on img src,
        */
        // after new divs and markers have added to the DOM
        // for each posts check if that new markers's lat lng is in one of the posts' lat lng
        // if so, we know that marker is on map and need to hide and render a new marker

        var posts = this.posts;
        let hasOverlay = false;
        var newPost = posts[posts.length-1];
        var newlyAddedInfoContent = document.getElementById(newPost._id)

        // if it has overlay, gotta first find the latlng is already in the set.
        // if it does, just find that div and append the newInfoWindow to that groupWindow
        var obj:object = {
          lat: newPost.place.geometry.location.lat,
          lng: newPost.place.geometry.location.lng,
        }
        for(var i = 0; i < this.positionList.length; i ++)
        if(this.positionList[i].toString() == obj.toString()){
          var identifer = newPost.place.geometry.location.lat.toString() + newPost.place.geometry.location.lng.toString();
          var oldGroupInfoWindowContent:any = document.getElementsByClassName(`${identifer}`)[0];
          oldGroupInfoWindowContent.prepend(newlyAddedInfoContent);
          // it does find it, but gotta remove it the marker after
          this.clearTempStates();
          this.lastInfoWindow.close();
          this.lastInfoWindow.open();
          this.mapInstance.markers[posts.length-1].setMap(null);
          return;
        }
        var helperDiv:any = document.getElementById('groupInfoWindowContent');
        let groupInfoWindowContent:any = document.createElement('div');
        groupInfoWindowContent.className = "markerInfoWindow";
        helperDiv.append(groupInfoWindowContent);
        for(var i = 0; i < posts.length-1; i++){
          if(posts[i].place.geometry.location.lat == newPost.place.geometry.location.lat &&
            posts[i].place.geometry.location.lng == newPost.place.geometry.location.lng){
              // match, hide all the overlay markers, push their info window divs to one, so they will display as one
              // this.mapInstance.markers[i].setVisible(false);
              let infowindow = document.getElementById(posts[i]._id);
              groupInfoWindowContent.prepend(infowindow);
              this.mapInstance.markers[i].setMap(null);
              hasOverlay = true;
            }
          }


          if(hasOverlay){

            var newlyAddedMarker = this.mapInstance.markers[this.mapInstance.markers.length-1];
            google.maps.event.clearListeners(newlyAddedMarker,'click');
            groupInfoWindowContent.className += " "+newPost.place.geometry.location.lat.toString()+newPost.place.geometry.location.lng.toString();

            groupInfoWindowContent.prepend(newlyAddedInfoContent);
            var groupInfoWindow = new google.maps.InfoWindow();
            groupInfoWindow.setContent(groupInfoWindowContent);
            let position = { lat: newPost.place.geometry.location.lat,
              lng: newPost.place.geometry.location.lng};
              this.positionList.push(position);
              newlyAddedMarker.addListener('click',()=>{
                this.clearTempStates();
                this.toggleInfoWindowState(newlyAddedMarker,groupInfoWindow,groupInfoWindowContent)
                if(groupInfoWindowContent){
                  for(var i =0 ; i < groupInfoWindowContent.children.length; i ++ ){
                    groupInfoWindowContent.children[i].style.display = "block";}
                  }
                })

              } // end of overlay if
            }
          }
        }


        onMapReady(map) {
          console.log('posts', map.posts);  // to get all posts as an array
          this.mapInstance = map;
          this.addCloseInfoWindowOnMapClickEvent();
          var input = <HTMLInputElement>(document.getElementById('geoSearch'));
          var autocomplete = new google.maps.places.Autocomplete(input);
          autocomplete.bindTo('bounds', map);

          var infowindow = new google.maps.InfoWindow();
          this.helperInfoWindow = infowindow;
          var infowindowContent = document.getElementById('infowindow-content');
          infowindow.setContent(infowindowContent);

          // For directing location after inputted a location.
          let helperMarker = this.createNewMarker(null);

          autocomplete.addListener('place_changed', ()=> {
            infowindow.close();
            helperMarker.setVisible(false);
            var place = autocomplete.getPlace();
            var infowindowContent = document.getElementById('infowindow-content');
            this.inputPlace = place;
            if (!place.geometry) {
              window.alert("No details available for input: '" + place.name + "'"); return;
            }
            // If the place has a geometry, then present it on a map.
            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(20);
            }
            helperMarker.setPosition(place.geometry.location);

            var address = '';
            if (place.address_components) {
              address = this.formatAddress(place.address_components);
            }
            // there was setting children null field;
          });
        }

        onMarkerInit(marker,post) {
          var markerInfoWinElement: any = document.getElementById(`${post._id}`);
          if(post.image_url){
            marker.setIcon({
              url: post.image_url,
              scaledSize: new google.maps.Size(40, 40),
            });
          }
          if(markerInfoWinElement){
            var markerInfoWindow = new google.maps.InfoWindow();
            markerInfoWindow.setContent(markerInfoWinElement);
          }else{
            let infoWindowDivs = document.getElementsByClassName(`markerInfoWindow`);
            markerInfoWinElement = infoWindowDivs[infoWindowDivs.length-1];
            markerInfoWinElement.id= post._id;
            var markerInfoWindow = new google.maps.InfoWindow();
            markerInfoWindow.setContent(markerInfoWinElement);
          }
          marker.addListener('click', ()=> {
            this.clearTempStates();
            this.toggleInfoWindowState(marker,markerInfoWindow,markerInfoWinElement);
          });
        }

        toggleInfoWindowState(marker, infoWindow, infoWindowElement){
          if(this.lastMarker === undefined || this.lastMarker === marker){
            marker.setAnimation(google.maps.Animation.BOUNCE);
            this.lastMarker = marker;
          }else if(this.lastMarker !== marker){
            this.lastMarker.setAnimation(null);
            marker.setAnimation(google.maps.Animation.BOUNCE);
            this.lastMarker = marker;
          }

          if(this.lastInfoWindow === undefined){
            this.lastInfoWindow = infoWindow;

            infoWindow.open(this.mapInstance, marker);
          }else if(this.lastInfoWindow !== infoWindow){
            this.lastInfoWindow.close();
            this.lastInfoWindow = infoWindow;

            infoWindow.open(this.mapInstance, marker);
          }else {
            this.lastInfoWindow = infoWindow;

            infoWindow.open(this.mapInstance, marker);
          }
          if(infoWindowElement){
            infoWindowElement.style.display ="block";
          }
        }

        createPost(){
          let place = this.inputPlace;
          if(!place){
            window.alert('Its an unrecognized place, please choose from autocomplete');return;
          }
          if(!place.geometry.viewport){
            window.alert('This place is not located on the map');return;
          }
          if(!this.title){
            window.alert('Please enter a title');return;
          }
          let post = {
            place: place,
            title: this.title,
            description: this.description,
            image_url: this.image_url,
            author: this.loggedInUser.username,
            user_id: this.loggedInUser._id,
          }

          this.postService.createPost(post)
          .subscribe((post)=>{
            let newPost = post.json()
            this.posts.push(newPost);
          });
          if(this.helperInfoWindow) this.helperInfoWindow.close();
          if(this.lastMarker) this.lastMarker.setAnimation(null);
          this.clearInputFields();
        }

        updatePost(post){
          console.log('updating post for', post);
          this.postService.updatePost(post)
          .subscribe((oldPost)=>{
            let index = this.posts.findIndex(function(p){
              return p._id ==post._id;
            });
            this.posts[index].title = post.title
            this.posts[index].description = post.description;
            this.toggleEditable(this.posts[index])
          });
        }

        deletePost(post_id){
          this.postService.deletePost(post_id)
          .subscribe((post)=>{
            let index = this.posts.findIndex(function(p){
              return p._id == post.json()._id;
            });
            this.posts.splice(index,1);
            this.lastMarker.setVisible(false);
            // this.lastInfoWindow.close();
          },err=>{
            console.log('error deleting a post');
            window.alert('Sorry, theres an error for processing your delete.');
          });
        }

        //////////////////////////////////////
        ///////// POST HELPER STUFF //////////
        //////////////////////////////////////

        clearInputFields(){
          var input = <HTMLInputElement>(document.getElementById('geoSearch'));
          input.value = "";
          this.title = "";
          this.description = "";
          this.image_url = "";
          var infowindowContent = document.getElementById('infowindow-content');
          if(infowindowContent){
            if(infowindowContent.children){
              infowindowContent.children['place-icon'].src = "";
              infowindowContent.children['place-name'].textContent = "";
              infowindowContent.children['place-address'].textContent = "";
            }
          }
        }

        addCloseInfoWindowOnMapClickEvent(){
          this.mapInstance.addListener('click',()=>{
            if(this.lastInfoWindow){
              this.lastInfoWindow.close();
            }
            if(this.helperInfoWindow) this.helperInfoWindow.close();
            if(this.lastMarker) this.lastMarker.setAnimation(null);
          })
          this.clearTempStates();
        }

        createNewMarker(position){
          let marker = new google.maps.Marker({
            map: this.mapInstance,
            anchorPoint: new google.maps.Point(0, -29),
            draggable: false,
            animation: google.maps.Animation.DROP,
            position: position,
            icon: "../../assets/group.png",
          });
          return marker
        }

        formatAddress(address_components){
          return [
            (address_components[0] && address_components[0].short_name || ''),
            (address_components[1] && address_components[1].short_name || ''),
            (address_components[2] && address_components[2].short_name || '')
          ].join(' ');
        }

        toggleEditable(post){
          if(this.editable){
            this.editable = "";
            this.tempTitle = "";
            this.tempDescription = "";
          }
          else {
            this.editable = post._id;
            this.tempTitle = post.title;
            this.tempDescription = post.description;
            this.tempPost = post;
          }
        }

        ///////////////////////////////////
        ///////// COMMENTS STUFF //////////
        ///////////////////////////////////

        toggleComments(post){
          if(this.displayComments){
            this.displayComments = "";
            this.displaySubComment = "";
            this.tempComment = "";
            this.editing = false;
          }
          else {
            this.displayComments = post._id;
          }
        }

        toggleSubComment(comment){
          if(this.displaySubComment){
            this.displaySubComment = "";
            this.tempSubComment = "";
            this.editing = false;
          }
          else {
            this.displaySubComment = comment._id;
            this.tempSubComment = comment;
            this.editing = true;
          }
        }

        addComment(post,comment){
          console.log(comment);
          let com = {
            user_id : this.loggedInUser._id,
            content : comment,

          }
          this.commentService.addComment(post._id,com)
          .subscribe(newComment=>{
            console.log('new comment came back is', newComment.json());
            let toBeUpdatePost = this.posts.find(p=>{
              return p._id === post._id
            });
            console.log('toBeUpdatePost', toBeUpdatePost);
            toBeUpdatePost.comments.push(newComment.json());
            console.log('new post is', toBeUpdatePost);
            console.log('all posts are', this.posts);
          },err=>{
            if(!this.loggedInUser){
              window.alert('Please log in to add comment')
            }

          })
          this.tempComment = "";
        }

        deleteSubComment(post,comment){
          console.log('post is', post);
          console.log('comment is ',comment);
          console.log('posts are before request', this.posts);
          this.commentService.deleteSubComment(post._id,comment._id)
          .subscribe(updatedComments=>{
            console.log('posts are', this.posts);
            let postIndex = this.posts.findIndex(p=>{
              return p._id == post._id
            });
            console.log('index is',postIndex);

            // let commentIndex =this.posts[postIndex].findIndex(c=>{
            //   return c._id = comment._id;
            // });

            this.posts[postIndex].comments = updatedComments.json();
            console.log(this.posts);
          });

        }

        updateSubComment(post,comment){
          console.log('updating comment');
          let newCom = {
            user_id: post.user_id,
            content: comment.content,
            _id: comment._id,
          }
          console.log('updating this comment..', comment);
          this.commentService.updateSubComment(post._id,comment._id,newCom)
          .subscribe(data=>{
            console.log('old comments are', post.comments);
            console.log('response is',data.json());
            post.comments[data.json().index].content = data.json().content;
            console.log('new comments are', post.comments);
            console.log('new comment is',post.comments[data.json().index]);
            this.toggleSubComment(post.comments[data.json().index]);
          },err=>{
            console.log('err in updating');
            window.alert('Theres an error processing your update');
          })
        }



      }
