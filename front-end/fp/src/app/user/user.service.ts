import { Injectable } from '@angular/core';
import { Http, Response, Headers, RequestOptions  } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';


@Injectable()
export class UserService {
  baseUrl = "https://glacial-chamber-79751.herokuapp.com";
  // baseUrl = "http://localhost:3000";
  constructor(private http: Http) { }

  getSessionUser(){
    return this.http.get(`${this.baseUrl}/login/user`,
    {withCredentials: true});
  }

  registerUser(username, pw){
    return this.http.post(`${this.baseUrl}/signup`,
      {username: username,
        password: pw,},
        {withCredentials: true});
  }

  loginUser(inputUser){
    // var user = JSON.stringify(inputUser);
    console.log('logging in');
    return this.http.post(`${this.baseUrl}/login`,
      {username: inputUser.username, password: inputUser.password},
      {withCredentials: true});
  }
}
