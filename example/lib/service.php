<?php


require 'vendor/autoload.php';


class RESTService {

  public static $server = 'localhost';

  protected $app;

  protected $db;

  protected $initialized = false;

  protected $running = false;

  public function __construct($database) {

    $m = new Mongo(self::$server);
    $this->db = $m->$database;

    $this->app = new \Slim\Slim();
    $this->initialized = false;
    $this->running = false;

    $this->initialize();
  }

  public function initialize() {

    if (!$this->initialized) {

      foreach ($this->routes as $route) {
        $this->route($route['type'], $route['route'], $route['method']);
      }

      $this->initialized = true;
    }
  }

  public function route($method, $route, $action) {
    if (!$this->running) {
      $that = $this;
      $args = array($route, function() use ($that, $action) {
        $arguments = func_get_args();
        $contents = call_user_func_array(array($that, $action), $arguments);
        $that->sendResponse($contents);
      });
      call_user_func_array(array($this->app, $method), $args);
    }
  }

  public function run() {
    if ($this->initialized && !$this->running) {
      $this->app->run();
      $this->running = true;
    }
  }

  public function sendResponse($contents) {

    if ($contents instanceof MongoCursor) {
      $contents = iterator_to_array($contents);
    } else if ($contents === null) {
      $this->app->notFound();
    }

    header('Access-Control-Allow-Methods: PUT, GET, POST, DELETE, OPTIONS');
    header('Access-Control-Allow-Origin: *');
    header('X-Powered-By: RESTfull Service');

    if ($this->app->request()->isAjax()) {
      $this->app->response()->header('Content-Type', 'application/json');
    } else {
      $this->app->response()->header('Content-Type', 'text/plain');
    }

    if (is_array($contents)) {
      $contents = json_encode($contents);
    }

    echo $contents;
  }
}
