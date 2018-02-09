'use strict';

import TestUtils from 'utilities/testing';
import defer from 'lodash/function/defer';
import Im from 'immutable';
import { fetch } from 'marty';
import { stateDefaultsGenerator } from 'state/common/generators/http-api';
import { ItemContainer } from 'state/common/generators/http-api/create-store';

const FoosState = stateDefaultsGenerator({
  entity: 'foo',
  endpoint: 'foos'
});

const listeners = [];

function addStoreChangeListener(Store, func) {
  const listener = Store.addChangeListener(func);
  listeners.push(listener);
}

function disposeOfListeners() {
  listeners.forEach(listener => listener.dispose());
}

describe('Store creation', () => {
  beforeEach(() => {
    TestUtils.server.create();
    disposeOfListeners();
    FoosState.Store.resetState();
  });

  it('can get items', (done) => {
    let pendingCalled = false;

    const invokeFetch = function () {
      const f = FoosState.Store.getItems();

      f.when({
        pending() {
          pendingCalled = true;
        },

        done(items) {
          expect(pendingCalled).to.equal(true);
          expect(items.get(0).get('name')).to.equal('foo1');
        }
      });

      return f.toPromise();
    };

    invokeFetch()
      .then(() => {
        // Respond to remote fetch.
        TestUtils.server.respondWith(/foos/, [
          {
            id: 1,
            name: 'foo1'
          }
        ]);

        return invokeFetch();
      })
      .then(() => done());

    // Respond to remote fetch.
    TestUtils.server.respondWith(/foos/, [
      {
        id: 1,
        name: 'foo1'
      }
    ]);
  });

  it('can filter items', (done) => {
    FoosState.Store.getItems()
      .toPromise()
      .then((items) => {
        expect(items.count()).to.equal(2);
        FoosState.Store.getItems({
          bar: true
        })
          .toPromise()
          .then((_items) => {
            expect(_items.count()).to.equal(1);
            expect(_items.get(0).get('id')).to.equal(2);
            expect(FoosState.Store.state.itemContainers.count()).to.equal(2);
            done();
          });

        // Item will be set to match bar=true filter
        TestUtils.server.respondWith(/foos/, [{ id: 2 }]);
      });

    // Will match all filters
    TestUtils.server.respondWith(/foos/, [{ id: 1 }, { id: 2 }]);
  });

  describe('#onRetrieved', () => {
    it('normalizes IDs', () => {
      let id = '123';
      FoosState.Store.onRetrieved(id, { id }, {}, Im.Map(), Im.Map());
      id = 123;
      FoosState.Store.onRetrieved(id, { id }, {}, Im.Map(), Im.Map());
      expect(FoosState.Store.state.itemContainers.count()).to.equal(1);
    });
  });

  describe('#onRetrievedMany', () => {
    it('normalizes IDs', () => {
      let id = '123';
      FoosState.Store.onRetrievedMany([{ id }], Im.Map(), Im.Map(), Im.Map());
      id = 123;
      FoosState.Store.onRetrievedMany([{ id }], Im.Map(), Im.Map(), Im.Map());
      expect(FoosState.Store.state.itemContainers.count()).to.equal(1);
    });
  });

  describe('#sortAccordingToQuery', () => {
    beforeEach(function () {
      const fakeData = Im.fromJS([
        {
          id: 1,
          name: 'ab',
          flagged: false,
          rel: { id: 3 }
        },
        {
          id: 2,
          name: 'ccbulkan',
          flagged: true,
          rel: { id: 1 }
        },
        {
          id: 44,
          name: 'aalex',
          flagged: true,
          rel: { id: 2 }
        },
        {
          id: 3,
          name: 'zz',
          flagged: false,
          rel: { name: 4 }
        }
      ]);

      this.sandbox.stub(FoosState.Store, 'getItemVersionsForFields').returns(fakeData);
      this.sandbox.spy(FoosState.Store, 'sortAccordingToQuery');
    });

    it('should sort items on single property of type `int`', () =>
      FoosState.Store.getItems({ ordering: '-id' })
        .toPromise()
        .then((items) => {
          expect(items.get(0).get('id')).to.equal(44);

          return FoosState.Store.getItems({ ordering: 'id' }).toPromise();
        })
        .then((items) => {
          expect(items.get(0).get('id')).to.equal(1);
          expect(FoosState.Store.sortAccordingToQuery.called).to.be.true;
        }));

    it('should sort items on single property of type `string`', () =>
      FoosState.Store.getItems({ ordering: '-name' })
        .toPromise()
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('zz');

          return FoosState.Store.getItems({ ordering: 'name' }).toPromise();
        })
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('aalex');
          expect(FoosState.Store.sortAccordingToQuery.called).to.be.true;
        }));

    it('should sort items on single property of type `bool`', () =>
      FoosState.Store.getItems({ ordering: '-flagged' })
        .toPromise()
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('ccbulkan');
          return FoosState.Store.getItems({ ordering: 'flagged' }).toPromise();
        })
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('ab');
          expect(FoosState.Store.sortAccordingToQuery.called).to.be.true;
        }));

    it('should sort on multiple properties, int & string', () =>
      FoosState.Store.getItems({ ordering: 'id,-name' })
        .toPromise()
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('ab');
          expect(items.get(3).get('id')).to.equal(44);
        }));

    it('should sort on multiple properties, bool & string', () =>
      FoosState.Store.getItems({ ordering: '-name,flagged' })
        .toPromise()
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('zz');
          expect(items.get(0).get('flagged')).to.be.false;

          expect(items.get(3).get('name')).to.equal('aalex');
          expect(items.get(3).get('flagged')).to.be.true;
        }));

    it('should sort on related fields', () =>
      FoosState.Store.getItems({ ordering: 'rel__id' })
        .toPromise()
        .then((items) => {
          expect(items.get(0).get('name')).to.equal('ccbulkan');

          expect(items.get(3).get('name')).to.equal('zz');
        }));
  });

  it('can get an item', (done) => {
    FoosState.Store.getItem(1)
      .toPromise()
      .then((item) => {
        expect(item.get('name')).to.equal('foobar');
        done();
      });

    TestUtils.server.respondWith(/foos\/1\//, {
      id: 1,
      name: 'foobar'
    });
  });

  it('can handle item not found', (done) => {
    FoosState.Store.getItem(100)
      .toPromise()
      .catch((err) => {
        expect(err.status).to.equal(404);
        done();
      });

    TestUtils.server.respondWith(/foos\/100\//, {}, {}, 404);
  });

  it('can return known count for a query', (done) => {
    const KNOWN_COUNT = 301;
    expect(FoosState.Store.getKnownCountForQuery({ bar: true })).to.equal(undefined);
    FoosState.Store.getItems({ bar: true })
      .toPromise()
      .then((items) => {
        expect(FoosState.Store.getKnownCountForQuery({ bar: true })).to.equal(KNOWN_COUNT);
        done();
      });

    TestUtils.server.respondWith(/foos/, [{ id: 1 }, { id: 2 }], {
      'X-Result-Count': KNOWN_COUNT
    });
  });

  it('can handle successful deletion', (done) => {
    FoosState.Store.getItems()
      .toPromise()
      .then((items) => {
        expect(items.count()).to.equal(1);
        const delPromise = FoosState.ActionCreators.delete(1);
        // Number of items should update immediately
        expect(FoosState.Store.state.itemContainers.count()).to.equal(0);
        expect(FoosState.Store.state.itemContainersPendingDelete.count()).to.equal(1);
        delPromise.then(() => {
          expect(FoosState.Store.state.itemContainers.count()).to.equal(0);
          expect(FoosState.Store.state.itemContainersPendingDelete.count()).to.equal(0);
          done();
        });
        TestUtils.server.respondWith(/foos/, {}, {}, 204);
      });
    TestUtils.server.respondWith(/foos/, [{ id: 1 }]);
  });

  it('can handle failed deletion', (done) => {
    FoosState.Store.getItems()
      .toPromise()
      .then((items) => {
        expect(items.count()).to.equal(1);
        const delPromise = FoosState.ActionCreators.delete(1);
        // Number of items should update immediately
        expect(FoosState.Store.state.itemContainers.count()).to.equal(0);
        expect(FoosState.Store.state.itemContainersPendingDelete.count()).to.equal(1);
        delPromise.catch(() => {
          // Deletion failed, so item should be reinstated
          expect(FoosState.Store.state.itemContainers.count()).to.equal(1);
          expect(FoosState.Store.state.itemContainersPendingDelete.count()).to.equal(0);
          done();
        });
        TestUtils.server.respondWith(/foos/, {}, {}, 403);
      });
    TestUtils.server.respondWith(/foos/, [{ id: 1 }]);
  });

  it('can handle creation', (done) => {
    const DATA = { id: 1, name: 'foobar' };

    FoosState.ActionCreators.create(DATA);

    addStoreChangeListener(FoosState.Store, () => {
      expect(FoosState.Store.state.itemContainers
        .get(1)
        .getVersion()
        .get('name')).to.equal(DATA.name);
      done();
    });

    TestUtils.server.respondWith(/foos/, DATA, {}, 201);
  });

  it('can handle successful updates', (done) => {
    FoosState.Store.getItem(1)
      .toPromise()
      .then(() => {
        let item = FoosState.Store.state.itemContainers.get(1).getVersion();
        expect(item.get('name')).to.equal('foobar');
        const updatePromise = FoosState.ActionCreators.update(1, {
          name: 'newname'
        });
        item = FoosState.Store.state.itemContainers.get(1).getVersion();
        expect(item.get('name')).to.equal('newname');
        expect(FoosState.Store.state.itemContainersPendingUpdate.count()).to.equal(1);
        updatePromise.then(() => {
          item = FoosState.Store.state.itemContainers.get(1).getVersion();
          expect(item.get('name')).to.equal('newname');
          expect(FoosState.Store.state.itemContainersPendingUpdate.count()).to.equal(0);
          done();
        });
        TestUtils.server.respondWith(
          /foos\/1\//,
          {
            id: 1,
            name: 'newname'
          },
          {},
          200
        );
      });
    TestUtils.server.respondWith(/foos\/1\//, {
      id: 1,
      name: 'foobar'
    });
  });

  it('can handle failed updates', (done) => {
    FoosState.Store.getItem(1)
      .toPromise()
      .then(() => {
        let item = FoosState.Store.state.itemContainers.get(1).getVersion();
        expect(item.get('name')).to.equal('foobar');
        const updatePromise = FoosState.ActionCreators.update(1, {
          name: 'newname'
        });
        item = FoosState.Store.state.itemContainers.get(1).getVersion();
        expect(item.get('name')).to.equal('newname');
        expect(FoosState.Store.state.itemContainersPendingUpdate.count()).to.equal(1);
        updatePromise.catch(() => {
          // Reset name because update failed
          item = FoosState.Store.state.itemContainers.get(1).getVersion();
          expect(item.get('name')).to.equal('foobar');
          expect(FoosState.Store.state.itemContainersPendingUpdate.count()).to.equal(0);
          done();
        });
        TestUtils.server.respondWith(/foos/, {}, {}, 403);
      });
    TestUtils.server.respondWith(/foos\/1\//, {
      id: 1,
      name: 'foobar'
    });
  });

  it('can handle successful custom actions', (done) => {
    FoosState.Store.getItem(1)
      .toPromise()
      .then(() => {
        const item = FoosState.Store.state.itemContainers.get(1).getVersion();
        expect(item.get('name')).to.equal('foobar');
        const doPromise = FoosState.ActionCreators.doDetailAction(1, 'some_action', {
          some: 'value'
        });
        expect(FoosState.Store.state.itemContainersPendingDoDetailAction.count()).to.equal(1);
        doPromise.then(() => {
          expect(FoosState.Store.state.itemContainersPendingDoDetailAction.count()).to.equal(0);
          done();
        });
        TestUtils.server.respondWith(
          /foos\/1\/some_action\//,
          {
            id: 1,
            name: 'newname'
          },
          {},
          200
        );
      });
    TestUtils.server.respondWith(/foos\/1\//, {
      id: 1,
      name: 'foobar'
    });
  });

  it('can handle failed custom actions', (done) => {
    FoosState.Store.getItem(1)
      .toPromise()
      .then(() => {
        const item = FoosState.Store.state.itemContainers.get(1).getVersion();
        expect(item.get('name')).to.equal('foobar');
        const doPromise = FoosState.ActionCreators.doDetailAction(1, 'some_action', {
          some: 'value'
        });
        expect(FoosState.Store.state.itemContainersPendingDoDetailAction.count()).to.equal(1);
        doPromise.catch(() => {
          expect(FoosState.Store.state.itemContainersPendingDoDetailAction.count()).to.equal(0);
          done();
        });
        TestUtils.server.respondWith(/foos\/1\/some_action\//, {}, {}, 403);
      });
    TestUtils.server.respondWith(/foos\/1\//, {
      id: 1,
      name: 'foobar'
    });
  });

  afterEach(() => {
    TestUtils.server.restore();
  });
});

describe('ItemContainer', () => {
  let itemContainer;

  beforeEach(() => {
    itemContainer = new ItemContainer(1);
  });

  describe('#addVersion', () => {
    it('adds new version to container which is keyed by the fields used for fetching that version', () => {
      let entity = Im.Map({
        name: 'Alex'
      });
      itemContainer.addVersion(entity);
      let version = itemContainer.getVersion();
      expect(version.get('name')).to.equal('Alex');
      const fetchOpts = Im.Map({
        fields: ['name', 'age']
      });
      entity = Im.Map({
        name: 'Alex',
        age: 24
      });
      itemContainer.addVersion(entity, fetchOpts);
      version = itemContainer.getVersion(fetchOpts);
      expect(version.get('age')).to.equal(24);
      // Make sure original version still exists.
      version = itemContainer.getVersion();
      expect(version.get('age')).to.not.exist;
    });
  });

  describe('#hasMatchingVersion', () => {
    it('returns `True` when matching version with same `fetchOpts` exists', () => {
      const fetchOpts = Im.Map({
        fields: ['name']
      });
      let entity = Im.Map({
        name: 'Alex'
      });
      itemContainer.addVersion(entity, fetchOpts);
      entity = Im.Map({
        name: 'Alex'
      });
      expect(itemContainer.hasMatchingVersion(entity, fetchOpts)).to.be.true;
    });

    it('returns `False` when matching version with same `fetchOpts` does not exist', () => {
      const fetchOpts = Im.Map({
        fields: ['name']
      });
      let entity = Im.Map({
        name: 'Alex'
      });
      expect(itemContainer.hasMatchingVersion(entity, fetchOpts)).to.be.false;
      itemContainer.addVersion(entity, fetchOpts);
      entity = Im.Map({
        name: 'Alex'
      });
      expect(itemContainer.hasMatchingVersion(entity)).to.be.false;
    });
  });

  describe('#updateVersion', () => {
    it('updates all stored versions', () => {
      let entity = Im.Map({
        name: 'Alex'
      });
      itemContainer.addVersion(entity);
      entity = Im.Map({
        name: 'Alex',
        age: 24
      });
      const fetchOpts = Im.Map({
        fields: ['name', 'age']
      });
      itemContainer.addVersion(entity, fetchOpts);
      itemContainer.updateVersions(Im.Map({ name: 'Bob' }));
      entity = itemContainer.getVersion();
      expect(entity.get('name')).to.equal('Bob');
      entity = itemContainer.getVersion(fetchOpts);
      expect(entity.get('name')).to.equal('Bob');
    });
  });

  describe('#rollbackMostRecentUpdate', () => {
    it('undoes the most recent update', () => {
      let entity = Im.Map({
        name: 'Alex'
      });
      itemContainer.addVersion(entity);

      itemContainer.updateVersions(Im.Map({ name: 'Bob' }));
      entity = itemContainer.getVersion();
      expect(entity.get('name')).to.equal('Bob');
      itemContainer.rollbackMostRecentUpdate();
      entity = itemContainer.getVersion();
      expect(entity.get('name')).to.equal('Alex');
    });
  });

  describe('#updateMatchesFilter', () => {
    it('sets whether `ItemContainer` matches a particular filter', () => {
      const filter = Im.Map({
        foo: 'bar'
      });
      itemContainer.updateMatchesFilter(filter);
      expect(itemContainer.doesMatchFilter(filter)).to.be.true;
      itemContainer.updateMatchesFilter(filter, false);
      expect(itemContainer.doesMatchFilter(filter)).to.be.false;
    });
  });
});
