<?php

require 'service.php';

class API extends RESTService {

  protected $routes = array(

    array( 'type' => 'post',        'route' => '/login',              'method' => 'login' ),

    array( 'type' => 'get',         'route' => '/posts',              'method' => 'getPosts' ),
    array( 'type' => 'get',         'route' => '/posts/:id',          'method' => 'getPost' ),
    array( 'type' => 'post',        'route' => '/posts',              'method' => 'createPost' ),
    array( 'type' => 'put',         'route' => '/posts/:id',          'method' => 'updatePost' ),
    array( 'type' => 'delete',      'route' => '/posts/:id',          'method' => 'deletePost' ),

    array( 'type' => 'get',         'route' => '/users',              'method' => 'getUsers' ),
    array( 'type' => 'get',         'route' => '/users/:id',          'method' => 'getUser' ),
    array( 'type' => 'post',        'route' => '/users',              'method' => 'createUser' ),
    array( 'type' => 'put',         'route' => '/users/:id',          'method' => 'updateUser' ),
    array( 'type' => 'delete',      'route' => '/users/:id',          'method' => 'deleteUser' ),

    array( 'type' => 'get',         'route' => '/messages',           'method' => 'getMessages' ),
    array( 'type' => 'get',         'route' => '/messages/:id',       'method' => 'getMessage' ),
    array( 'type' => 'post',        'route' => '/messages',           'method' => 'createMessage' ),
    array( 'type' => 'put',         'route' => '/messages/:id',       'method' => 'updateMessage' ),
    array( 'type' => 'delete',      'route' => '/messages/:id',       'method' => 'deleteMessage' ),

    array( 'type' => 'get',         'route' => '/todos',              'method' => 'getTodos' ),
    array( 'type' => 'get',         'route' => '/todos/:id',          'method' => 'getTodo' ),
    array( 'type' => 'post',        'route' => '/todos',              'method' => 'createTodo' ),
    array( 'type' => 'put',         'route' => '/todos/:id',          'method' => 'updateTodo' ),
    array( 'type' => 'delete',      'route' => '/todos/:id',          'method' => 'deleteTodo' ),

  );

  public function login() {


    $credentials = $this->app->request()->params();

    if (!isset($credentials['username']) || trim($credentials['username']) === '') {
      $this->app->error('username missing');
    }

    if (!isset($credentials['password']) || trim($credentials['password']) === '') {
      $this->app->error('password missing');
    }

    try {

      $user = $this->db->users->findOne(
        array('username' => $credentials['username']),
        array('username', 'password', 'email')
      );

      if ($user !== null) {

        if ($user['password'] == $credentials['password']) {
          return true;
        }


      }

      throw new Exception("Invalid credentials", 403);

    } catch (Exception $e) {

      return array(
        'code' => $e->getCode(),
        'message' => $e->getMessage()
      );
    }
  }

  public function createPost() {
    $post = json_decode($this->app->request()->getBody(), true);
    $this->db->posts->insert($post);
    return $post;
  }

  public function updatePost($id) {
    $criteria = array( '_id' => new MongoId($id));
    $post = json_decode($this->app->request()->getBody(), true);
    $this->db->posts->update($criteria, $post);
    return $post;
  }

  public function deletePost($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->posts->remove($criteria);
  }

  public function getPosts() {
    return $this->db->posts->find();
  }

  public function getPost($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->posts->findOne($criteria);
  }

  public function createUser() {
    return $this->db->users->insert(json_decode($this->app->request()->getBody()));
  }

  public function updateUser($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->users->update($criteria, json_decode($this->app->request()->getBody()));
  }

  public function deleteUser($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->users->remove($criteria);
  }

  public function getUsers() {
    return $this->db->users->find();
  }

  public function getUser($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->users->findOne($criteria);
  }

  public function getMessages() {
    return $this->db->messages->find();
  }

  public function getMessage($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->messages->findOne($criteria);
  }

  public function createMessage() {
    return $this->db->messages->insert(json_decode($this->app->request()->getBody()));
  }

  public function updateMessage($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->messages->update($criteria, json_decode($this->app->request()->getBody()));
  }

  public function deleteMessage($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->messages->remove($criteria);
  }

  public function getTodos() {
    return $this->db->todos->find();
  }

  public function getTodo($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->todos->findOne($criteria);
  }

  public function createTodo() {
    return $this->db->todos->insert(json_decode($this->app->request()->getBody()));
  }

  public function updateTodo($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->todos->update($criteria, json_decode($this->app->request()->getBody()));
  }

  public function deleteTodo($id) {
    $criteria = array( '_id' => new MongoId($id));
    return $this->db->todos->remove($criteria);
  }
  
}