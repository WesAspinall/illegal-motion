function CrimesService($http, API) {

  this.getCrimes = function() {
    return $http
      .get(API.CRIMES).then((res) => {
        return res.data;
      });
  };

}


angular
  .module('components.crimes')
  .service('CrimesService', CrimesService);